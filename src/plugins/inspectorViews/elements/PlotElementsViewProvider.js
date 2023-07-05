/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

import PlotElementsPool from './PlotElementsPool.vue';
import Vue from 'vue';

export default function PlotElementsViewProvider(openmct) {
  return {
    key: 'plotElementsView',
    name: 'Elements',
    canView: function (selection) {
      return selection?.[0]?.[0]?.context?.item?.type === 'telemetry.plot.overlay';
    },
    view: function (selection) {
      let app = null;
      let component = null;

      const domainObject = selection?.[0]?.[0]?.context?.item;

      return {
        show: function (el) {
          app = Vue.createApp({
            el,
            components: {
              PlotElementsPool
            },
            provide: {
              openmct,
              domainObject
            },
            template: `<PlotElementsPool />`
          });
          component = app.mount(el);
        },
        showTab: function (isEditing) {
          const hasComposition = Boolean(domainObject && openmct.composition.get(domainObject));

          return hasComposition && isEditing;
        },
        priority: function () {
          return openmct.priority.DEFAULT;
        },
        destroy: function () {
          app.unmount();
          component = null;
          app = null;
        }
      };
    }
  };
}
