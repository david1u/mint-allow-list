// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/allow-list-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {getEnvVar, getEnvVarAsNumber} from '@collabland/common';
import {ApplicationConfig} from '@loopback/core';
import {RestApplication} from '@loopback/rest';
import {fileURLToPath} from 'url';
import {DevActionComponent} from './component.js';

/**
 * A demo application to expose REST APIs for Hello action
 */
export class HelloActionApplication extends RestApplication {
  constructor(config?: ApplicationConfig) {
    super(HelloActionApplication.resolveConfig(config));
    this.component(DevActionComponent);
    const dir = fileURLToPath(new URL('../public', import.meta.url));
    this.static('/', dir);
  }

  private static resolveConfig(config?: ApplicationConfig): ApplicationConfig {
    return {
      ...config,
      rest: {
        port: getEnvVarAsNumber('PORT', 3000),
        host: getEnvVar('HOST'),
        ...config?.rest,
      },
    };
  }
}
