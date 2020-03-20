/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

import EventEmitter from 'EventEmitter';
import {OPERATIONS} from '../utils/operations';

export default class TelemetryCriterion extends EventEmitter {

    /**
     * Subscribes/Unsubscribes to telemetry and emits the result
     * of operations performed on the telemetry data returned and a given input value.
     * @constructor
     * @param telemetryDomainObjectDefinition {id: uuid, operation: enum, input: Array, metadata: string, key: {domainObject.identifier} }
     * @param openmct
     */
    constructor(telemetryDomainObjectDefinition, openmct) {
        super();

        this.openmct = openmct;
        this.objectAPI = this.openmct.objects;
        this.telemetryAPI = this.openmct.telemetry;
        this.timeAPI = this.openmct.time;
        this.id = telemetryDomainObjectDefinition.id;
        this.telemetry = telemetryDomainObjectDefinition.telemetry;
        this.operation = telemetryDomainObjectDefinition.operation;
        this.input = telemetryDomainObjectDefinition.input;
        this.metadata = telemetryDomainObjectDefinition.metadata;
        // this.subscription = null;
        this.telemetryObjectIdAsString = this.objectAPI.makeKeyString(this.telemetry);

        this.on(`subscription:${this.telemetryObjectIdAsString}`, this.handleSubscription);
        this.objectAPI.get(this.telemetryObjectIdAsString).then((obj) => this.initialize(obj));
    }

    initialize(obj) {
        this.telemetryObject = obj;
        this.emitEvent('criterionUpdated', this);
    }

    formatData(data) {
        const datum = {
            result: this.computeResult(data)
        }

        if (data) {
            // TODO check back to see if we should format times here
            this.timeAPI.getAllTimeSystems().forEach(timeSystem => {
                datum[timeSystem.key] = data[timeSystem.key]
            });
        }
        return datum;
    }

    handleSubscription(data) {
        if(this.isValid()) {
            this.emitEvent('criterionResultUpdated', this.formatData(data));
        }
    }

    findOperation(operation) {
        for (let i=0, ii=OPERATIONS.length; i < ii; i++) {
            if (operation === OPERATIONS[i].name) {
                return OPERATIONS[i].operation;
            }
        }
        return null;
    }

    computeResult(data) {
        let result = false;
        if (data) {
            let comparator = this.findOperation(this.operation);
            let params = [];
            params.push(data[this.metadata]);
            if (this.input instanceof Array && this.input.length) {
                this.input.forEach(input => params.push(input));
            }
            if (typeof comparator === 'function') {
                result = comparator(params);
            }
        }
        return result;
    }

    emitEvent(eventName, data) {
        this.emit(eventName, {
            id: this.id,
            data: data
        });
    }

    isValid() {
        return this.metadata && this.operation;
    }

    requestLAD(options) {
        options = Object.assign({},
            options,
            {
                strategy: 'latest',
                size: 1
            }
        );

        return this.objectAPI.get(this.objectAPI.makeKeyString(this.telemetry))
            .then((obj) => {
                if (!obj || !this.isValid()) {
                    return this.formatData({});
                }
                return this.telemetryAPI.request(
                    obj,
                    options
                ).then(results => {
                    const latestDatum = results.length ? results[results.length - 1] : {};
                    return {
                        id: this.id,
                        data: this.formatData(latestDatum)
                    };
                });
            });
    }

    destroy() {
        this.off('receivedTelemetry', this.handleSubscription);
        this.emitEvent('criterionRemoved');
        delete this.telemetryObjectIdAsString;
    }
}
