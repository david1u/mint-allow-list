// Copyright Abridged, Inc. 2023. All Rights Reserved.
// Node module: @collabland/allow-list-action
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Component} from '@loopback/core';
import {AllowListController} from './actions/allow-list.controller.js';

/**
 * Register all services including command handlers, job runners and services
 */
export class DevActionComponent implements Component {
  controllers = [AllowListController];
}
