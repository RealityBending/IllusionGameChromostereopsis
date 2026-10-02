---
title: "Chromostereopsis Pilot - Analysis"
editor: source
editor_options:
  chunk_output_type: console
format:
  html:
    code-fold: true
    self-contained: false
    toc: true
    keep-md: true
execute:
  cache: false
---

## Packages


::: {.cell}

```{.r .cell-code}
library(jsonlite)
library(tidyverse)
library(easystats)
library(patchwork)
```
:::


## Data

Each session of the task (`experiment/`) is saved as one JSON container with `session`,
`demographics`, `design` and `trials`. Every trial carries the full Pyllusion parameter
dictionary it was rendered from, so the design does not have to be reconstructed here - it is
read off the trials.

Sessions come from two places: `data/pilots/` (files downloaded from the task's end screen, in
the repo) and `data/raw/` (sessions saved to Zenodo through DataPipe, fetched by
`data/download.py`, git-ignored). Test runs (`test_...`) and the partial files of people who
stopped partway (`....partial.json`, a different format) are left out.


::: {.cell}

```{.r .cell-code  code-fold="false"}
path <- c("../data/pilots", "../data/raw")
```
:::


### Reading one session

The only awkward entries are the colours, which are RGB triplets rather than scalars; they
are collapsed to `"r,g,b"` strings, as the task's own CSV export does. `null` (the
`size_panel` "fill" level, and the tap coordinates of keyboard responses) becomes `NA`.


::: {.cell}

```{.r .cell-code  code-fold="false"}
# One JSON entry -> one value fit for a dataframe column
as_column <- function(x) {
  if (is.null(x) || length(x) == 0) return(NA)
  if (length(x) > 1) return(paste(unlist(x), collapse = ","))  # RGB triplets
  x[[1]]
}

read_session <- function(file) {
  d <- jsonlite::fromJSON(file, simplifyVector = FALSE)

  # One row per trial: the trial-level fields, then the parameter dictionary
  trials <- map(d$trials, function(trial) {
    fields <- trial[setdiff(names(trial), "parameters")]
    as_tibble(map(c(fields, trial$parameters), as_column))
  }) |>
    list_rbind()

  # Session and demographics are constant within a file, so repeat them on every row
  meta <- c(map(d$session, as_column), map(d$demographics, as_column))
  trials |> mutate(!!!meta, .before = 1)
}
```
:::


### All sessions


::: {.cell}

```{.r .cell-code  code-fold="false"}
files <- list.files(path, pattern = "\\.json$", full.names = TRUE)
files <- files[!grepl("\\.partial\\.json$", files) & !startsWith(basename(files), "test_")]

df <- map(files, read_session) |>
  list_rbind() |>
  mutate(
    Participant = participant_id,
    # The judged attribute. `Difference` is the signed area difference, positive = left
    # disc is larger; its magnitude is task difficulty and its sign the correct answer.
    Difference_Abs = abs(Difference),
    Difference_Side = if_else(Difference > 0, "Left", "Right"),
    # The illusion. The sign of `Illusion_Strength` says which panel holds the
    # red-leaning disc (>= 0 is left), its magnitude the chromatic separation.
    Red_Side = case_when(
      Illusion_Strength > 0 ~ "Left",
      Illusion_Strength < 0 ~ "Right",
      .default = "None"  # both panels are the same purple
    ),
    # Illusion_Strength = as.factor(Illusion_Strength),
    # Response
    Response = str_remove(response, "Arrow"),
    ResponseRight = Response == "Right",
    Error = !correct,
    RT = rt / 1000,
    ISI = isi / 1000,
    # Screened stimulus factors, as factors
    across(c(Size, Gap, Density, Dither_Size), \(x) factor(x), .names = "{.col}_f"),
    Equiluminant = as.logical(Equiluminant),
    Size_Panel_Mode = factor(Size_Panel_Mode, levels = c("fill", "match")),
    # Recorded but uncontrolled moderators
    age = as.numeric(age)
  )
```
:::



## Sanity checks



::: {.cell}

```{.r .cell-code}
df |>
  summarise(
    Trials = n(),
    Sets = n_distinct(set),
    Blocks = n_distinct(block),
    Accuracy = mean(correct),
    RT_median = median(RT),
    # ISO 8601 with a "Z": as.POSIXct() silently keeps only the date, ymd_hms() does not
    Duration_min = as.numeric(difftime(ymd_hms(end_time[1]), ymd_hms(start_time[1]), units = "mins")),
    .by = Participant
  ) |>
  display()
```

::: {.cell-output-display}


|Participant | Trials| Sets| Blocks| Accuracy| RT_median| Duration_min|
|:-----------|------:|----:|------:|--------:|---------:|------------:|
|b8t8gbrk    |    200|   10|      4|     0.90|      1.05|        21.03|
|hxms54yd    |    250|   10|      4|     0.72|      0.54|         9.96|
|myhiy2id    |    250|   10|      4|     0.80|      0.60|        20.45|
|afchqsd5    |    250|   10|      4|     0.75|      0.57|        12.08|
|9bv9m7gt    |    200|   10|      4|     0.98|      0.66|        15.59|


:::
:::


Design balance. The difficulty x strength grid is crossed exactly, so every cell should
appear once per set - i.e. `n_sets` times:


::: {.cell}

```{.r .cell-code}
df |>
  count(Illusion_Strength, Difference_Abs) |>
  pivot_wider(names_from = Difference_Abs, values_from = n, names_sort = TRUE) |>
  display()
```

::: {.cell-output-display}


|Illusion_Strength | 0.025| 0.05| 0.1| 0.25| 0.5| 1 |
|:-----------------|-----:|----:|---:|----:|---:|:--|
|-1.00             |    30|   40|  50|   50|  50|10 |
|-0.50             |    30|   40|  50|   50|  50|10 |
|0.00              |    30|   40|  50|   50|  50|10 |
|0.50              |    30|   40|  50|   50|  50|10 |
|1.00              |    30|   40|  50|   50|  50|10 |


:::
:::


The sign of the difference is balanced *within* each strength level, so these should be
close to half and half rather than exact:


::: {.cell}

```{.r .cell-code}
df |>
  count(Illusion_Strength, Difference_Side) |>
  pivot_wider(names_from = Difference_Side, values_from = n) |>
  display()
```

::: {.cell-output-display}


|Illusion_Strength | Left| Right|
|:-----------------|----:|-----:|
|-1.00             |  111|   119|
|-0.50             |  116|   114|
|0.00              |  115|   115|
|0.50              |  111|   119|
|1.00              |  113|   117|


:::
:::


The screened factors are assigned by balanced randomisation, so each level should be close
to equally frequent (exactly so for the two-level ones):


::: {.cell}

```{.r .cell-code}
map(
  c("Size", "Gap", "Density", "Dither_Size", "Equiluminant", "Size_Panel_Mode"),
  \(f) {
    df |>
      count(.data[[f]]) |>
      rename(Level = 1) |>
      mutate(Factor = f, Level = as.character(Level), .before = 1)
  }
) |>
  list_rbind() |>
  display()
```

::: {.cell-output-display}


|Factor          | Level|  n |
|:---------------|-----:|:---|
|Size            |  0.25|385 |
|Size            |   0.5|383 |
|Size            |  0.75|382 |
|Gap             |     0|380 |
|Gap             |  0.02|382 |
|Gap             |  0.06|388 |
|Density         |   0.5|386 |
|Density         |  0.75|379 |
|Density         |     1|385 |
|Dither_Size     |     2|378 |
|Dither_Size     |     4|389 |
|Dither_Size     |     8|383 |
|Equiluminant    | FALSE|571 |
|Equiluminant    |  TRUE|579 |
|Size_Panel_Mode |  fill|576 |
|Size_Panel_Mode | match|574 |


:::
:::


## Duration

How long the task actually takes, which is what the session length (`n_sets`) has to be set
against. Two clocks are logged and they line up: `start_time` / `end_time` are wall clock
(ISO, UTC), while `stimulus_onset` is `performance.now()`, i.e. milliseconds since the page
loaded. Since the page loads at `start_time`, the two can be combined to split the session
into its parts.


::: {.cell}

```{.r .cell-code  code-fold="false"}
durations <- df |>
  arrange(Participant, order) |>
  mutate(
    trial_end = stimulus_onset + rt,  # ms since page load
    gap = (stimulus_onset - lag(trial_end)) / 1000,
    after_break = block != lag(block, default = first(block)),
    .by = Participant
  ) |>
  summarise(
    Trials = n(),
    Total = as.numeric(difftime(ymd_hms(end_time[1]), ymd_hms(start_time[1]), units = "mins")),
    Instructions = first(stimulus_onset) / 60000,
    Breaks = sum(gap[after_break], na.rm = TRUE) / 60,
    Task = (last(trial_end) - first(stimulus_onset)) / 60000,
    .by = Participant
  ) |>
  mutate(
    Trials_time = Task - Breaks,
    Sec_per_trial = Trials_time * 60 / Trials,
    Residual = (Total - Instructions - Trials_time - Breaks) * 60
  )

durations |>
  select(Participant, Trials, Total, Instructions, Trials_time, Breaks, Sec_per_trial, Residual) |>
  display()
```

::: {.cell-output-display}


|Participant | Trials|Total | Instructions| Trials_time| Breaks| Sec_per_trial| Residual|
|:-----------|------:|:-----|------------:|-----------:|------:|-------------:|--------:|
|9bv9m7gt    |    200|15.59 |         6.49|        7.92|   1.17|          2.38|     0.51|
|afchqsd5    |    250|12.08 |         2.45|        9.08|   0.54|          2.18|     0.19|
|b8t8gbrk    |    200|21.03 |         0.98|        9.31|  10.74|          2.79|     0.35|
|hxms54yd    |    250| 9.96 |         0.79|        8.81|   0.35|          2.11|     0.67|
|myhiy2id    |    250|20.45 |         0.99|        9.77|   9.69|          2.34|    -0.10|


:::
:::



::: {.cell}

```{.r .cell-code}
durations |>
  summarise(across(
    c(Total, Instructions, Trials_time, Breaks, Sec_per_trial),
    list(mean = mean, min = min, max = max)
  )) |>
  pivot_longer(everything(), names_to = c("Part", "Stat"), names_pattern = "(.*)_(mean|min|max)") |>
  pivot_wider(names_from = Stat, values_from = value) |>
  display()
```

::: {.cell-output-display}


|Part          | mean | min |  max |
|:-------------|:-----|:----|:-----|
|Total         |15.82 |9.96 |21.03 |
|Instructions  | 2.34 |0.79 | 6.49 |
|Trials_time   | 8.98 |7.92 | 9.77 |
|Breaks        | 4.50 |0.35 |10.74 |
|Sec_per_trial | 2.36 |2.11 | 2.79 |


:::
:::


Composition of each session:


::: {.cell}

```{.r .cell-code}
durations |>
  select(Participant, Instructions, Trials_time, Breaks) |>
  pivot_longer(-Participant, names_to = "Part", values_to = "Minutes") |>
  mutate(Part = factor(
    Part,
    levels = c("Instructions", "Trials_time", "Breaks"),
    labels = c("Instructions", "Trials", "Breaks")
  )) |>
  ggplot(aes(x = Participant, y = Minutes, fill = Part)) +
  # reverse = TRUE so the parts read in chronological order once flipped
  geom_bar(stat = "identity", position = position_stack(reverse = TRUE)) +
  scale_fill_manual(values = c(Instructions = "#78909C", Trials = "#9C27B0", Breaks = "#FFB300")) +
  labs(x = NULL, y = "Minutes", fill = NULL, title = "Session duration") +
  coord_flip() +
  theme_modern()
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-11-1.png){width=672}
:::
:::


Per block, to see whether people slow down or speed up as the session goes on. `Break_after`
is the self-paced break screen that followed the block.


::: {.cell}

```{.r .cell-code}
by_trial <- df |>
  arrange(Participant, order) |>
  mutate(
    trial_end = stimulus_onset + rt,
    gap = (stimulus_onset - lag(trial_end)) / 1000,
    prev_block = lag(block),
    .by = Participant
  )

# The break that followed a block is the gap sitting on the first trial of the next one
breaks <- by_trial |>
  filter(block != prev_block) |>
  select(Participant, block = prev_block, Break_after = gap)

by_trial |>
  summarise(
    Trials = n(),
    Minutes = (last(trial_end) - first(stimulus_onset)) / 60000,
    RT_median = median(RT),
    Error = mean(Error),
    .by = c(Participant, block)
  ) |>
  left_join(breaks, by = c("Participant", "block")) |>
  display()
```

::: {.cell-output-display}


|Participant | block| Trials| Minutes| RT_median| Error| Break_after|
|:-----------|-----:|------:|-------:|---------:|-----:|-----------:|
|9bv9m7gt    |     1|     50|    2.09|      0.76|  0.02|       15.53|
|9bv9m7gt    |     2|     50|    1.91|      0.63|  0.00|       50.03|
|9bv9m7gt    |     3|     50|    1.97|      0.68|  0.04|        4.49|
|9bv9m7gt    |     4|     50|    1.95|      0.63|  0.00|            |
|afchqsd5    |     1|     63|    2.29|      0.58|  0.22|        9.11|
|afchqsd5    |     2|     63|    2.22|      0.51|  0.32|       20.83|
|afchqsd5    |     3|     63|    2.33|      0.58|  0.22|        2.72|
|afchqsd5    |     4|     61|    2.24|      0.60|  0.25|            |
|b8t8gbrk    |     1|     50|    2.25|      0.97|  0.12|      339.65|
|b8t8gbrk    |     2|     50|    2.42|      1.10|  0.10|       21.02|
|b8t8gbrk    |     3|     50|    2.24|      1.03|  0.10|      283.53|
|b8t8gbrk    |     4|     50|    2.40|      1.15|  0.08|            |
|hxms54yd    |     1|     63|    2.29|      0.58|  0.29|       11.57|
|hxms54yd    |     2|     63|    2.20|      0.51|  0.27|        5.41|
|hxms54yd    |     3|     63|    2.20|      0.53|  0.27|        4.26|
|hxms54yd    |     4|     61|    2.12|      0.54|  0.31|            |
|myhiy2id    |     1|     63|    2.54|      0.76|  0.22|       16.61|
|myhiy2id    |     2|     63|    2.76|      0.73|  0.16|      510.38|
|myhiy2id    |     3|     63|    2.28|      0.54|  0.29|       54.41|
|myhiy2id    |     4|     61|    2.18|      0.53|  0.13|            |


:::
:::


At 2.4 s per trial, a set of 20 trials costs about
0.8 min of trial time, so `n_sets` can be
priced directly: the instruction phase is a fixed overhead on top, and the breaks are
self-paced.

## Overview


::: {.cell}

```{.r .cell-code}
p1 <- df |>
  summarise(Error = mean(Error), .by = c(Difference_Abs, Participant)) |>
  ggplot(aes(x = factor(Difference_Abs), y = Error)) +
  geom_bar(stat = "identity", fill = "#9C27B0") +
  labs(x = "Area difference", y = "Error rate", title = "Difficulty") +
  theme_modern()

p2 <- df |>
  ggplot(aes(x = RT)) +
  geom_histogram(bins = 40, fill = "#9C27B0") +
  labs(x = "RT (s)", y = NULL, title = "Reaction times") +
  theme_modern()

p1 | p2
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-13-1.png){width=672}
:::
:::



::: {.cell}

```{.r .cell-code}
m <- glm(ResponseRight ~ Difference, data = df, family = "binomial")

estimate_relation(m, length = 100) |> 
  plot()
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-14-1.png){width=672}
:::
:::


## Models



::: {.cell}

```{.r .cell-code}
m <- glm(Error ~ poly(Illusion_Strength, 2) * as.factor(Difference_Abs),
         data = df, family = "binomial")

estimate_prediction(m) |> 
  filter(Difference_Abs < 1) |> 
  mutate(Illusion_Strength = as.numeric(as.character(Illusion_Strength))) |> 
  ggplot(aes(x=Illusion_Strength, y = Predicted, group = Difference_Abs)) +
  geom_ribbon(aes(fill = Difference_Abs, ymin = CI_low, ymax= CI_high), alpha = 0.2) +
  geom_line(aes(color = Difference_Abs)) +
  scale_color_gradient(low = "red", high = "green") +
  scale_fill_gradient(low = "red", high = "green")
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-15-1.png){width=672}
:::
:::



::: {.cell}

```{.r .cell-code}
m <- lm(RT ~ Illusion_Strength * as.factor(Difference_Abs), 
        data = filter(df, Error == FALSE))

estimate_prediction(m) |> 
  filter(Difference_Abs < 1) |> 
  mutate(Illusion_Strength = as.numeric(as.character(Illusion_Strength))) |> 
  ggplot(aes(x=Illusion_Strength, y = Predicted, group = Difference_Abs)) +
  geom_ribbon(aes(fill = Difference_Abs, ymin = CI_low, ymax= CI_high), alpha = 0.2) +
  geom_line(aes(color = Difference_Abs)) +
  scale_color_gradient(low = "red", high = "green") +
  scale_fill_gradient(low = "red", high = "green")
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-16-1.png){width=672}
:::
:::





## Modulation


::: {.cell}

```{.r .cell-code}
rez <- data.frame()
for(var in c("Illusion_Strength" ,"Equiluminant", "Size", "Gap", "Density", "Dither_Size", "Size_Panel")) {
  if(!var %in% c("Size_Panel", "Illusion_Strength")) {
    var <- paste0("as.factor(", var, ")")
  }
  f <- paste0("Error ~ Difference_Abs * ", var)
  m <- glm(f, family = "binomial", data = df)
  rez <- parameters(m) |>
    as.data.frame() |> 
    tail(n = 2) |> 
    mutate(Variable = var) |> 
    select(Variable, Parameter, Coefficient, p) |> 
    rbind(rez)
}
arrange(rez, p)
```
:::




::: {.cell}

```{.r .cell-code}
m <- glm(Error ~ Difference_Abs,
         data = df, family = "binomial")

estimate_prediction(m, by = "Difference_Abs") |> 
  plot()
```

::: {.cell-output-display}
![](analysis_files/figure-html/unnamed-chunk-18-1.png){width=672}
:::
:::

