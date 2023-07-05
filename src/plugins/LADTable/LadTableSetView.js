/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import LadTableSet from './components/LadTableSet.vue';
import LADTableConfiguration from './LADTableConfiguration';
import Vue from 'vue';

export default class LadTableSetView {
  constructor(openmct, domainObject, objectPath) {
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.objectPath = objectPath;
    this.app = null;
    this.component = null;
  }

  show(element) {
    let ladTableConfiguration = new LADTableConfiguration(this.domainObject, this.openmct);

    this.app = Vue.createApp({
      el: element,
      components: {
        LadTableSet
      },
      provide: {
        openmct: this.openmct,
        objectPath: this.objectPath,
        currentView: this,
        ladTableConfiguration
      },
      data: () => {
        return {
          domainObject: this.domainObject
        };
      },
      template: '<lad-table-set ref="ladTableSet" :domain-object="domainObject"></lad-table-set>'
    });
    this.component = this.app.mount(element);
  }

  getViewContext() {
    if (!this.component) {
      return {};
    }

    return this.component.$refs.ladTableSet.getViewContext();
  }

  destroy(element) {
    this.app.unmount();
    this.component = null;
    this.app = null;
  }
}
