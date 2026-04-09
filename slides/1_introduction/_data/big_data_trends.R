#### ___ ####

#### 0.1 - Package ####

Packages <- c("tidyverse", "lubridate")
lapply(Packages, library, character.only = T)
options(tibble.print_max = Inf, scipen=999)

#### 0.2 - Data ####

Trends <- read_csv("/Users/nadjimfrechet/Library/CloudStorage/Dropbox/UdeM/Fas-1001/quartos/cours_1/_data/big_data_trend.csv") %>% 
  mutate(date    = lubridate::my(month)) %>% 
  select(-month) 

#### 1 - Graph ####

ggplot(Trends, aes(x = date, y = word_impact)) +
  expand_limits(y=0:100) +
  geom_line(size = 2, color = "black") +
  scale_x_date("", date_breaks = "years") +
  scale_y_continuous("Proportion des recherche (%)\n", breaks = seq(0,100,10)) +
  ### First event ###
  ggplot2::annotate("text", x = as.Date("2011-10-01"), y = 50, label = "Big data initiative?", color = "black", angle = 90, size = 15) +
  geom_vline(xintercept = as.Date("2012-03-03"), linetype="longdash",
             color = "black", size=2)  +
  labs(title   = "Google Trends 'Big Data'",
       caption = "Source: Google trends") +
  theme_bw(base_size = 40) + 
  theme(plot.caption = element_text(hjust = 0, colour = "black"),
        legend.key.size = unit(3, 'cm'),
        axis.text.x = element_text(hjust = 1, angle = 65),
        axis.title.y = element_text(color = "black"))
ggsave('/Users/nadjimfrechet/Library/CloudStorage/Dropbox/UdeM/Fas-1001/quartos/cours_1/_photos/google_trends_big_data.png', width = 25, height = 20)

