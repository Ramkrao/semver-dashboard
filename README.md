# Getting Started with Capacity Planning Template (CPT)

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

# GitHub Pages
This application is hosted using [GitHub pages](https://pages.github.com/) feature and could be accessed via the link https://pages.github.service.anz/das/capacity-planning-template/.


# Local Development

1. CPT uses ANZ's Ocean Blue React component libary for all the components. Hence, it is essential to follow their install guide to start the setup. Use this link https://pages.github.service.anz/horizon/website/develop/usage/install-guide and follow the steps for yarn and component libraries setup.

2. After the initial setup, install rest of the depencies using `yarn` utility. Run `yarn install`

# Data Refresh - SRE steps

To refresh the data, run the below steps periodically:

1. Switch to the Scripts directory `cd ./scripts`
2. Run the data extractor bash script providing the start and end dates `bash data_extactor.bash -s 2022-05-01 -e 2022-05-31`
3. Make sure the previous step completed without any errors and the file `src/config/system_stats.json` is updated with revised stats
4. Finally, use yarn to build the application and publish to Github pages using the command `yarn run deploy`


## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `yarn run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

### `yarn run deploy`

Publishes the `build` folder to GitHub pages under the configured repo's `gh-pages` branch

# Capacity Calculator Formulas
Various formulas were used to calculate the capacity increase across systems. Here's a summary:

### SoBIH

                      Total Number of Files
              -------------------------------------- * 100
                   Max Limit of files per day

### Interconnect

                            Total file size in Bytes
                     --------------------------------------
                             Hours of the day (24)
                -------------------------------------------------- * 100
                    Average Bytes handled per hour (peak/offpeak)

### DTaaS

                        Number of Files
                 --------------------------------
                 Average files processed per hour
              -------------------------------------- * 100
                   Max Limit of files per hour

### ADP

                        Total Number of ADP Transformations
                     ----------------------------------------
                                Seconds in a Day
                -------------------------------------------------- * 100
                    Total transformations supported per Second

### BIF

                        Number of Files
                 --------------------------------
                 Average files processed per hour
              -------------------------------------- * 100
                   Max Limit of files per hour
