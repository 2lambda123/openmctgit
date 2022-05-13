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

import EventEmitter from 'EventEmitter';
import {
    MULTIPLE_PROVIDER_ERROR,
    NO_PROVIDER_ERROR
} from './constants';
import User from './User';

class UserAPI extends EventEmitter {
    constructor(openmct) {
        super();

        this._openmct = openmct;
        this._provider = undefined;

        this.User = User;

        this.onProviderStatusChange = this.onProviderStatusChange.bind(this);
        this.onProviderPollQuestionChange = this.onProviderPollQuestionChange.bind(this);

        this._openmct.once('destroy', () => {
            if (typeof this._provider.off === 'function') {
                this._provider.off('statusChange', this.onProviderStatusChange);
                this._provider.off('pollQuestionChange', this.onProviderPollQuestionChange);
            }
        });
    }

    /**
     * Set the user provider for the user API. This allows you
     *  to specifiy ONE user provider to be used with Open MCT.
     * @method setProvider
     * @memberof module:openmct.UserAPI#
     * @param {module:openmct.UserAPI~UserProvider} provider the new
     *        user provider
     */
    setProvider(provider) {
        if (this.hasProvider()) {
            this._error(MULTIPLE_PROVIDER_ERROR);
        }

        this._provider = provider;
        if (typeof this._provider.on === 'function') {
            this._provider.on('statusChange', this.onProviderStatusChange);
            this._provider.on('pollQuestionChange', this.onProviderPollQuestionChange);
        }

        this.emit('providerAdded', this._provider);
    }

    onProviderStatusChange(newStatus) {
        this.emit('statusChange', newStatus);
    }

    onProviderPollQuestionChange(pollQuestion) {
        this.emit('pollQuestionChange', pollQuestion);
    }

    /**
     * Return true if the user provider has been set.
     *
     * @memberof module:openmct.UserAPI#
     * @returns {boolean} true if the user provider exists
     */
    hasProvider() {
        return this._provider !== undefined;
    }

    /**
     * If a user provider is set, it will return a copy of a user object from
     * the provider. If the user is not logged in, it will return undefined;
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Function|Promise} user provider 'getCurrentUser' method
     * @throws Will throw an error if no user provider is set
     */
    getCurrentUser() {
        this._noProviderCheck();

        return this._provider.getCurrentUser();
    }

    canProvideStatus() {
        this._noProviderCheck();

        if (this._provider.canProvideStatus) {
            return this._provider.canProvideStatus();
        } else {
            return false;
        }
    }

    canSetPollQuestion() {
        this._noProviderCheck();

        if (this._provider.canSetPollQuestion) {
            return this._provider.canSetPollQuestion();
        } else {
            return Promise.resolve(false);
        }
    }

    canClearAllStatuses() {
        this._noProviderCheck();

        if (this._provider.clearAllStatuses !== undefined) {
            return true;
        } else {
            return false;
        }
    }

    getActiveStatusRole() {
        this._noProviderCheck();

        if (this._provider.getActiveStatusRole) {
            return this._provider.getActiveStatusRole();
        } else {
            this._error("User provider cannot provide role status for this user");
        }
    }

    getPossibleStatuses() {
        this._noProviderCheck();

        if (this._provider.getPossibleStatuses) {
            return this._provider.getPossibleStatuses();
        } else {
            this._error("User provider cannot provide statuses");
        }
    }

    getStatus() {
        this._noProviderCheck();

        if (this._provider.getStatus) {
            return this._provider.getStatus();
        } else {
            this._error("User provider does not support role status");
        }
    }

    canGetRolesInStatus() {
        this._noProviderCheck();

        if (this._provider.getRolesInStatus) {
            return true;
        } else {
            return false;
        }
    }

    getRolesInStatus(status) {
        this._noProviderCheck();

        if (this._provider.getRolesInStatus) {
            return this._provider.getRolesInStatus(status);
        } else {
            this._error("User provider does not support role status");
        }
    }

    setStatus(status) {
        this._noProviderCheck();

        if (this._provider.setStatus) {
            return this._provider.setStatus(status);
        } else {
            this._error("User provider does not support setting role status");
        }
    }

    async setPollQuestion(questionText) {
        this._noProviderCheck();

        if (this.canSetPollQuestion()) {
            const result = await this._provider.setPollQuestion(questionText);

            if (this.canClearAllStatuses()) {
                await this.clearAllStatuses();
            } else {
                console.warn("Poll question set but unable to clear operator statuses because user provider does not support it.");
            }

            return result;
        } else {
            this._error("User provider does not support setting polling question");
        }
    }

    getPollQuestion() {
        this._noProviderCheck();

        if (this._provider.getPollQuestion) {
            return this._provider.getPollQuestion();
        } else {
            this._error("User provider does not support polling questions");
        }
    }

    clearAllStatuses() {
        this._noProviderCheck();

        if (this._provider.clearAllStatuses) {
            return this._provider.clearAllStatuses();
        } else {
            this._error("User provider does not support clearing all statuses");
        }
    }

    /**
     * If a user provider is set, it will return the user provider's
     * 'isLoggedIn' method
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Function|Boolean} user provider 'isLoggedIn' method
     * @throws Will throw an error if no user provider is set
     */
    isLoggedIn() {
        if (!this.hasProvider()) {
            return false;
        }

        return this._provider.isLoggedIn();
    }

    /**
     * If a user provider is set, it will return a call to it's
     * 'hasRole' method
     *
     * @memberof module:openmct.UserAPI#
     * @returns {Function|Boolean} user provider 'isLoggedIn' method
     * @param {string} roleId id of role to check for
     * @throws Will throw an error if no user provider is set
     */
    hasRole(roleId) {
        this._noProviderCheck();

        return this._provider.hasRole(roleId);
    }

    /**
     * Checks if a provider is set and if not, will throw error
     *
     * @private
     * @throws Will throw an error if no user provider is set
     */
    _noProviderCheck() {
        if (!this.hasProvider()) {
            this._error(NO_PROVIDER_ERROR);
        }
    }

    /**
     * Utility function for throwing errors
     *
     * @private
     * @param {string} error description of error
     * @throws Will throw error passed in
     */
    _error(error) {
        throw new Error(error);
    }
}

export default UserAPI;
