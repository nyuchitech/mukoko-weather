# Weather Data Enhancement Plan

## PR 1: Core Weather Metrics (Next)

Enhance the weather data pipeline with essential metrics currently available but not consumed from our providers.

### Temperature Averages
- [ ] Add `temperatureAvg` from Tomorrow.io daily response — show average daily temperature alongside high/low
- [ ] Add `temperatureMinTime` / `temperatureMaxTime` — display when the hottest/coldest part of the day occurs
- [ ] Surface these in `DailyForecast` cards and `HistoryDashboard` summary stats

### Humidity Enhancements
- [ ] Add `humidityMax` / `humidityMin` / `humidityAvg` from Tomorrow.io daily response
- [ ] Add `dew_point_2m` to Open-Meteo hourly request — ensures dew point data in fallback path
- [ ] Show daily humidity range in `AtmosphericSummary` metric card (e.g. "45–82%")
- [ ] Add humidity trend indicator (rising/falling/stable) based on hourly data

### Wind Enhancements
- [ ] Add `windDirectionAvg` from Tomorrow.io daily response — show dominant daily wind direction
- [ ] Add `wind_direction_10m_dominant` to Open-Meteo daily request for fallback parity
- [ ] Display dominant wind direction in `DailyForecast` cards
- [ ] Add wind direction compass indicator to wind metric card

### Shared Work
- [ ] Update `TomorrowDailyValues` interface in `src/lib/tomorrow.ts`
- [ ] Update `normalizeTomorrowResponse()` to map new fields to `WeatherData`
- [ ] Update Open-Meteo request params in `src/lib/weather.ts`
- [ ] Update `WeatherData` / `DailyForecast` types to include new fields
- [ ] Add/update tests for new field mapping and normalization
- [ ] Run full pre-commit checklist (tests, lint, typecheck, build)

---

## PR 2: Soil & Farming Data (Future)

Leverage Open-Meteo's free soil data for farming activity insights.

- [ ] Add `soil_temperature_0cm` / `soil_temperature_6cm` / `soil_temperature_18cm` / `soil_temperature_54cm` to Open-Meteo hourly request
- [ ] Add `soil_moisture_0_to_1cm` / `soil_moisture_1_to_3cm` / `soil_moisture_3_to_9cm` / `soil_moisture_9_to_27cm` / `soil_moisture_27_to_81cm`
- [ ] Add `et0_fao_evapotranspiration` (hourly + daily) — FAO standard crop water demand
- [ ] Add `vapour_pressure_deficit` — plant stress monitoring
- [ ] Create soil data section in `ActivityInsights` for farming category
- [ ] Create irrigation recommendation logic based on soil moisture + ET0

## PR 3: Storm & Safety Data (Future)

Free convective indices from Open-Meteo to complement Tomorrow.io's storm data.

- [ ] Add `cape` (Convective Available Potential Energy) — thunderstorm severity prediction
- [ ] Add `lifted_index` — storm potential indicator
- [ ] Add `freezing_level_height` — frost altitude for mountainous locations
- [ ] Add `freezingRainIntensity` from Tomorrow.io free tier
- [ ] Enhance frost alert system with freezing level data
- [ ] Add storm risk indicator to mining/outdoor activity insights

## PR 4: Solar & Radiation Data (Future)

Free solar data from Open-Meteo for energy and farming insights.

- [ ] Add `shortwave_radiation` / `direct_radiation` / `diffuse_radiation`
- [ ] Add `sunshine_duration` (daily) — actual sunshine vs daylight hours
- [ ] Create solar energy potential display for location pages
- [ ] Integrate sunshine hours into farming activity insights

## PR 5: Cloud Layer Detail (Future)

Granular cloud data for photography, tourism, and drone activities.

- [ ] Add `cloud_cover_low` / `cloud_cover_mid` / `cloud_cover_high` from Open-Meteo
- [ ] Enhance tourism/photography insights with cloud layer breakdown
- [ ] Add cloud layer chart to atmospheric details page

## PR 6: Air Quality (Future)

Free air quality data from Open-Meteo's separate API endpoint.

- [ ] Integrate Open-Meteo Air Quality API (`/v1/air-quality`)
- [ ] Add `pm2_5`, `pm10`, `dust`, `ozone`, `nitrogen_dioxide`
- [ ] Create air quality display component
- [ ] Add air quality warnings to mining and urban activity insights
- [ ] Add circuit breaker for air quality API

## PR 7: Precipitation Detail (Future)

Better rain classification and snow tracking.

- [ ] Add `rain` vs `showers` distinction from Open-Meteo — frontal vs convective
- [ ] Add `snowfall` / `snow_depth` for highland and ASEAN locations
- [ ] Add `precipitation_hours` (daily) — duration of rain events
- [ ] Add `precipitationIntensity` consumption from Tomorrow.io (already fetched for map tiles)
- [ ] Improve precipitation charts with rain type breakdown

## PR 8: Upper-Level Wind (Future)

Multi-height wind data for energy and structural safety.

- [ ] Add `wind_speed_80m` / `wind_speed_120m` from Open-Meteo
- [ ] Add `wind_direction_80m` / `wind_direction_120m`
- [ ] Wind shear detection for aviation/drone safety
- [ ] Wind energy potential assessment display

## PR 9: Tomorrow.io Day/Night Weather Codes (Future)

- [ ] Add `weatherCodeDay` / `weatherCodeNight` / `weatherCodeFullDay` from Tomorrow.io
- [ ] Show separate day/night condition icons in daily forecast
- [ ] Use full-day code for daily summary descriptions
