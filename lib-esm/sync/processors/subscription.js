var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import API, { GRAPHQL_AUTH_MODE } from '@aws-amplify/api';
import Auth from '@aws-amplify/auth';
import Cache from '@aws-amplify/cache';
import { ConsoleLogger as Logger, Hub } from '@aws-amplify/core';
import { CONTROL_MSG as PUBSUB_CONTROL_MSG } from '@aws-amplify/pubsub';
import Observable from 'zen-observable-ts';
import { buildSubscriptionGraphQLOperation, getAuthorizationRules, getUserGroupsFromToken, TransformerMutationType, } from '../utils';
import { ModelPredicateCreator } from '../../predicates';
import { validatePredicate } from '../../util';
var logger = new Logger('DataStore');
export var CONTROL_MSG;
(function (CONTROL_MSG) {
    CONTROL_MSG["CONNECTED"] = "CONNECTED";
})(CONTROL_MSG || (CONTROL_MSG = {}));
export var USER_CREDENTIALS;
(function (USER_CREDENTIALS) {
    USER_CREDENTIALS[USER_CREDENTIALS["none"] = 0] = "none";
    USER_CREDENTIALS[USER_CREDENTIALS["unauth"] = 1] = "unauth";
    USER_CREDENTIALS[USER_CREDENTIALS["auth"] = 2] = "auth";
})(USER_CREDENTIALS || (USER_CREDENTIALS = {}));
var SubscriptionProcessor = /** @class */ (function () {
    function SubscriptionProcessor(schema, syncPredicates, amplifyConfig) {
        if (amplifyConfig === void 0) { amplifyConfig = {}; }
        this.schema = schema;
        this.syncPredicates = syncPredicates;
        this.amplifyConfig = amplifyConfig;
        this.typeQuery = new WeakMap();
        this.buffer = [];
    }
    SubscriptionProcessor.prototype.buildSubscription = function (namespace, model, transformerMutationType, userCredentials, cognitoTokenPayload, oidcTokenPayload) {
        var aws_appsync_authenticationType = this.amplifyConfig.aws_appsync_authenticationType;
        var _a = this.getAuthorizationInfo(model, userCredentials, aws_appsync_authenticationType, cognitoTokenPayload, oidcTokenPayload) || {}, authMode = _a.authMode, isOwner = _a.isOwner, ownerField = _a.ownerField, ownerValue = _a.ownerValue;
        var _b = __read(buildSubscriptionGraphQLOperation(namespace, model, transformerMutationType, isOwner, ownerField), 3), opType = _b[0], opName = _b[1], query = _b[2];
        return { authMode: authMode, opType: opType, opName: opName, query: query, isOwner: isOwner, ownerField: ownerField, ownerValue: ownerValue };
    };
    SubscriptionProcessor.prototype.getAuthorizationInfo = function (model, userCredentials, defaultAuthType, cognitoTokenPayload, oidcTokenPayload) {
        if (cognitoTokenPayload === void 0) { cognitoTokenPayload = {}; }
        if (oidcTokenPayload === void 0) { oidcTokenPayload = {}; }
        var rules = getAuthorizationRules(model);
        // Return null if user doesn't have proper credentials for private API with IAM auth
        var iamPrivateAuth = defaultAuthType === GRAPHQL_AUTH_MODE.AWS_IAM &&
            rules.find(function (rule) { return rule.authStrategy === 'private' && rule.provider === 'iam'; });
        if (iamPrivateAuth && userCredentials === USER_CREDENTIALS.unauth) {
            return null;
        }
        // Group auth should take precedence over owner auth, so we are checking
        // if rule(s) have group authorization as well as if either the Cognito or
        // OIDC token has a groupClaim. If so, we are returning auth info before
        // any further owner-based auth checks.
        var groupAuthRules = rules.filter(function (rule) {
            return rule.authStrategy === 'groups' &&
                ['userPools', 'oidc'].includes(rule.provider);
        });
        var validGroup = (defaultAuthType === GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS ||
            defaultAuthType === GRAPHQL_AUTH_MODE.OPENID_CONNECT) &&
            groupAuthRules.find(function (groupAuthRule) {
                // validate token against groupClaim
                var cognitoUserGroups = getUserGroupsFromToken(cognitoTokenPayload, groupAuthRule);
                var oidcUserGroups = getUserGroupsFromToken(oidcTokenPayload, groupAuthRule);
                return __spread(cognitoUserGroups, oidcUserGroups).find(function (userGroup) {
                    return groupAuthRule.groups.find(function (group) { return group === userGroup; });
                });
            });
        if (validGroup) {
            return {
                authMode: defaultAuthType,
                isOwner: false,
            };
        }
        // Owner auth needs additional values to be returned in order to create the subscription with
        // the correct parameters so we are getting the owner value from the Cognito token via the
        // identityClaim from the auth rule.
        var cognitoOwnerAuthRules = defaultAuthType === GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS
            ? rules.filter(function (rule) {
                return rule.authStrategy === 'owner' && rule.provider === 'userPools';
            })
            : [];
        var ownerAuthInfo;
        cognitoOwnerAuthRules.forEach(function (ownerAuthRule) {
            var ownerValue = cognitoTokenPayload[ownerAuthRule.identityClaim];
            if (ownerValue) {
                ownerAuthInfo = {
                    authMode: GRAPHQL_AUTH_MODE.AMAZON_COGNITO_USER_POOLS,
                    isOwner: ownerAuthRule.areSubscriptionsPublic ? false : true,
                    ownerField: ownerAuthRule.ownerField,
                    ownerValue: ownerValue,
                };
            }
        });
        if (ownerAuthInfo) {
            return ownerAuthInfo;
        }
        // Owner auth needs additional values to be returned in order to create the subscription with
        // the correct parameters so we are getting the owner value from the OIDC token via the
        // identityClaim from the auth rule.
        var oidcOwnerAuthRules = defaultAuthType === GRAPHQL_AUTH_MODE.OPENID_CONNECT
            ? rules.filter(function (rule) { return rule.authStrategy === 'owner' && rule.provider === 'oidc'; })
            : [];
        oidcOwnerAuthRules.forEach(function (ownerAuthRule) {
            var ownerValue = oidcTokenPayload[ownerAuthRule.identityClaim];
            if (ownerValue) {
                ownerAuthInfo = {
                    authMode: GRAPHQL_AUTH_MODE.OPENID_CONNECT,
                    isOwner: ownerAuthRule.areSubscriptionsPublic ? false : true,
                    ownerField: ownerAuthRule.ownerField,
                    ownerValue: ownerValue,
                };
            }
        });
        if (ownerAuthInfo) {
            return ownerAuthInfo;
        }
        // Fallback: return default auth type
        return {
            authMode: defaultAuthType,
            isOwner: false,
        };
    };
    SubscriptionProcessor.prototype.hubQueryCompletionListener = function (completed, capsule) {
        var event = capsule.payload.event;
        if (event === PUBSUB_CONTROL_MSG.SUBSCRIPTION_ACK) {
            completed();
        }
    };
    SubscriptionProcessor.prototype.start = function () {
        var _this = this;
        var ctlObservable = new Observable(function (observer) {
            var promises = [];
            var subscriptions = [];
            var cognitoTokenPayload, oidcTokenPayload;
            var userCredentials = USER_CREDENTIALS.none;
            (function () { return __awaiter(_this, void 0, void 0, function () {
                var credentials, err_1, session, err_2, token, federatedInfo, currentUser, payload, err_3;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, Auth.currentCredentials()];
                        case 1:
                            credentials = _a.sent();
                            userCredentials = credentials.authenticated
                                ? USER_CREDENTIALS.auth
                                : USER_CREDENTIALS.unauth;
                            return [3 /*break*/, 3];
                        case 2:
                            err_1 = _a.sent();
                            return [3 /*break*/, 3];
                        case 3:
                            _a.trys.push([3, 5, , 6]);
                            return [4 /*yield*/, Auth.currentSession()];
                        case 4:
                            session = _a.sent();
                            cognitoTokenPayload = session.getIdToken().decodePayload();
                            return [3 /*break*/, 6];
                        case 5:
                            err_2 = _a.sent();
                            return [3 /*break*/, 6];
                        case 6:
                            _a.trys.push([6, 11, , 12]);
                            token = void 0;
                            return [4 /*yield*/, Cache.getItem('federatedInfo')];
                        case 7:
                            federatedInfo = _a.sent();
                            if (!federatedInfo) return [3 /*break*/, 8];
                            token = federatedInfo.token;
                            return [3 /*break*/, 10];
                        case 8: return [4 /*yield*/, Auth.currentAuthenticatedUser()];
                        case 9:
                            currentUser = _a.sent();
                            if (currentUser) {
                                token = currentUser.token;
                            }
                            _a.label = 10;
                        case 10:
                            if (token) {
                                payload = token.split('.')[1];
                                oidcTokenPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
                            }
                            return [3 /*break*/, 12];
                        case 11:
                            err_3 = _a.sent();
                            logger.debug('error getting OIDC JWT', err_3);
                            return [3 /*break*/, 12];
                        case 12:
                            Object.values(this.schema.namespaces).forEach(function (namespace) {
                                Object.values(namespace.models)
                                    .filter(function (_a) {
                                    var syncable = _a.syncable;
                                    return syncable;
                                })
                                    .forEach(function (modelDefinition) { return __awaiter(_this, void 0, void 0, function () {
                                    var queriesMetadata;
                                    var _this = this;
                                    return __generator(this, function (_a) {
                                        queriesMetadata = [
                                            TransformerMutationType.CREATE,
                                            TransformerMutationType.UPDATE,
                                            TransformerMutationType.DELETE,
                                        ].map(function (op) {
                                            return _this.buildSubscription(namespace, modelDefinition, op, userCredentials, cognitoTokenPayload, oidcTokenPayload);
                                        });
                                        queriesMetadata.forEach(function (_a) {
                                            var transformerMutationType = _a.opType, opName = _a.opName, query = _a.query, isOwner = _a.isOwner, ownerField = _a.ownerField, ownerValue = _a.ownerValue, authMode = _a.authMode;
                                            return __awaiter(_this, void 0, void 0, function () {
                                                var variables, queryObservable, subscriptionReadyCallback;
                                                var _this = this;
                                                return __generator(this, function (_b) {
                                                    variables = {};
                                                    if (isOwner) {
                                                        if (!ownerValue) {
                                                            // Check if there is an owner field, check where this error should be located
                                                            observer.error('Owner field required, sign in is needed in order to perform this operation');
                                                            return [2 /*return*/];
                                                        }
                                                        variables[ownerField] = ownerValue;
                                                    }
                                                    queryObservable = API.graphql(__assign({ query: query, variables: variables }, { authMode: authMode }));
                                                    subscriptions.push(queryObservable
                                                        .map(function (_a) {
                                                        var value = _a.value;
                                                        return value;
                                                    })
                                                        .subscribe({
                                                        next: function (_a) {
                                                            var data = _a.data, errors = _a.errors;
                                                            if (Array.isArray(errors) && errors.length > 0) {
                                                                var messages = errors.map(function (_a) {
                                                                    var message = _a.message;
                                                                    return message;
                                                                });
                                                                logger.warn("Skipping incoming subscription. Messages: " + messages.join('\n'));
                                                                _this.drainBuffer();
                                                                return;
                                                            }
                                                            var predicatesGroup = ModelPredicateCreator.getPredicates(_this.syncPredicates.get(modelDefinition), false);
                                                            var _b = opName, record = data[_b];
                                                            // checking incoming subscription against syncPredicate.
                                                            // once AppSync implements filters on subscriptions, we'll be
                                                            // able to set these when establishing the subscription instead.
                                                            // Until then, we'll need to filter inbound
                                                            if (_this.passesPredicateValidation(record, predicatesGroup)) {
                                                                _this.pushToBuffer(transformerMutationType, modelDefinition, record);
                                                            }
                                                            _this.drainBuffer();
                                                        },
                                                        error: function (subscriptionError) {
                                                            var _a = subscriptionError.error, _b = __read((_a === void 0 ? {
                                                                errors: [],
                                                            } : _a).errors, 1), _c = _b[0], _d = (_c === void 0 ? {} : _c).message, message = _d === void 0 ? '' : _d;
                                                            logger.warn('subscriptionError', message);
                                                            if (typeof subscriptionReadyCallback === 'function') {
                                                                subscriptionReadyCallback();
                                                            }
                                                            if (message.includes('"errorType":"Unauthorized"')) {
                                                                return;
                                                            }
                                                            observer.error(message);
                                                        },
                                                    }));
                                                    promises.push((function () { return __awaiter(_this, void 0, void 0, function () {
                                                        var boundFunction;
                                                        var _this = this;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0: return [4 /*yield*/, new Promise(function (res) {
                                                                        subscriptionReadyCallback = res;
                                                                        boundFunction = _this.hubQueryCompletionListener.bind(_this, res);
                                                                        Hub.listen('api', boundFunction);
                                                                    })];
                                                                case 1:
                                                                    _a.sent();
                                                                    Hub.remove('api', boundFunction);
                                                                    return [2 /*return*/];
                                                            }
                                                        });
                                                    }); })());
                                                    return [2 /*return*/];
                                                });
                                            });
                                        });
                                        return [2 /*return*/];
                                    });
                                }); });
                            });
                            Promise.all(promises).then(function () { return observer.next(CONTROL_MSG.CONNECTED); });
                            return [2 /*return*/];
                    }
                });
            }); })();
            return function () {
                subscriptions.forEach(function (subscription) { return subscription.unsubscribe(); });
            };
        });
        var dataObservable = new Observable(function (observer) {
            _this.dataObserver = observer;
            _this.drainBuffer();
            return function () {
                _this.dataObserver = null;
            };
        });
        return [ctlObservable, dataObservable];
    };
    SubscriptionProcessor.prototype.passesPredicateValidation = function (record, predicatesGroup) {
        if (!predicatesGroup) {
            return true;
        }
        var predicates = predicatesGroup.predicates, type = predicatesGroup.type;
        return validatePredicate(record, type, predicates);
    };
    SubscriptionProcessor.prototype.pushToBuffer = function (transformerMutationType, modelDefinition, data) {
        this.buffer.push([transformerMutationType, modelDefinition, data]);
    };
    SubscriptionProcessor.prototype.drainBuffer = function () {
        var _this = this;
        if (this.dataObserver) {
            this.buffer.forEach(function (data) { return _this.dataObserver.next(data); });
            this.buffer = [];
        }
    };
    return SubscriptionProcessor;
}());
export { SubscriptionProcessor };
//# sourceMappingURL=subscription.js.map