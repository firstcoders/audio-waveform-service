# General

A serverless microservice to dynamically produce waveforms data which can then be used to render a waveform in a browser.

## Contributing

> This repo is a subtree split of our monorepo which will be made public in due course. We cannot process any pull-requests to this repo. Please contact us for help.

# Requirements

Installation of this service requires an AWS account and IAM credentials with appropriate permissions.

# Installation

```shell
npm install @soundws/audio-waveform-service
```

or using yarn

```shell
yarn add @soundws/audio-waveform-service
```

# Deployment

Please refer to the AWS SAM documentation on how to deploy [AWS SAM applications](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-deploying.html)

Refer to the `dist/template.yaml` file for information on the cloudformation deployment parameters.

Note that deployment of this service depends on a lambda layer provided via the parameter `AudiowaveformLayerArn`. Please refer to the `Audio Waveform Lambda Layer` documentation.

# License

Copyright (C) 2019-2023 First Coders LTD

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.
