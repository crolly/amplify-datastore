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
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import API from '@aws-amplify/api';
import Observable from 'zen-observable-ts';
import { buildGraphQLOperation, predicateToGraphQLFilter } from '../utils';
import { jitteredExponentialRetry, ConsoleLogger as Logger, } from '@aws-amplify/core';
import { ModelPredicateCreator } from '../../predicates';
var logger = new Logger('DataStore');
var DEFAULT_PAGINATION_LIMIT = 1000;
var DEFAULT_MAX_RECORDS_TO_SYNC = 10000;
var SyncProcessor = /** @class */ (function () {
    function SyncProcessor(schema, maxRecordsToSync, syncPageSize, syncPredicates) {
        if (maxRecordsToSync === void 0) { maxRecordsToSync = DEFAULT_MAX_RECORDS_TO_SYNC; }
        if (syncPageSize === void 0) { syncPageSize = DEFAULT_PAGINATION_LIMIT; }
        this.schema = schema;
        this.maxRecordsToSync = maxRecordsToSync;
        this.syncPageSize = syncPageSize;
        this.syncPredicates = syncPredicates;
        this.typeQuery = new WeakMap();
        this.generateQueries();
    }
    SyncProcessor.prototype.generateQueries = function () {
        var _this = this;
        Object.values(this.schema.namespaces).forEach(function (namespace) {
            Object.values(namespace.models)
                .filter(function (_a) {
                var syncable = _a.syncable;
                return syncable;
            })
                .forEach(function (model) {
                var _a = __read(buildGraphQLOperation(namespace, model, 'LIST'), 1), _b = __read(_a[0]), opNameQuery = _b.slice(1);
                _this.typeQuery.set(model, opNameQuery);
            });
        });
    };
    SyncProcessor.prototype.graphqlFilterFromPredicate = function (model) {
        if (!this.syncPredicates) {
            return null;
        }
        var predicatesGroup = ModelPredicateCreator.getPredicates(this.syncPredicates.get(model), false);
        if (!predicatesGroup) {
            return null;
        }
        return predicateToGraphQLFilter(predicatesGroup);
    };
    SyncProcessor.prototype.retrievePage = function (modelDefinition, lastSync, nextToken, limit, filter) {
        if (limit === void 0) { limit = null; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, opName, query, variables, data, _b, opResult, items, newNextToken, startedAt;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = __read(this.typeQuery.get(modelDefinition), 2), opName = _a[0], query = _a[1];
                        variables = {
                            limit: limit,
                            nextToken: nextToken,
                            lastSync: lastSync,
                            filter: filter,
                        };
                        return [4 /*yield*/, this.jitteredRetry(query, variables, opName)];
                    case 1:
                        data = (_c.sent()).data;
                        _b = opName, opResult = data[_b];
                        items = opResult.items, newNextToken = opResult.nextToken, startedAt = opResult.startedAt;
                        return [2 /*return*/, { nextToken: newNextToken, startedAt: startedAt, items: items }];
                }
            });
        });
    };
    SyncProcessor.prototype.jitteredRetry = function (query, variables, opName) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, jitteredExponentialRetry(function (query, variables) { return __awaiter(_this, void 0, void 0, function () {
                            var error_1, unauthorized, result;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, API.graphql({
                                                query: query,
                                                variables: variables,
                                            })];
                                    case 1: return [2 /*return*/, _a.sent()];
                                    case 2:
                                        error_1 = _a.sent();
                                        unauthorized = error_1.errors.some(function (err) { return err.errorType === 'Unauthorized'; });
                                        if (unauthorized) {
                                            result = error_1;
                                            result.data[opName].items = result.data[opName].items.filter(function (item) { return item !== null; });
                                            logger.warn('queryError', 'User is unauthorized, some items could not be returned.');
                                            return [2 /*return*/, result];
                                        }
                                        else {
                                            throw error_1;
                                        }
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }, [query, variables])];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SyncProcessor.prototype.start = function (typesLastSync) {
        var _this = this;
        var processing = true;
        var maxRecordsToSync = this.maxRecordsToSync !== undefined
            ? this.maxRecordsToSync
            : DEFAULT_MAX_RECORDS_TO_SYNC;
        var syncPageSize = this.syncPageSize !== undefined
            ? this.syncPageSize
            : DEFAULT_PAGINATION_LIMIT;
        var parentPromises = new Map();
        var observable = new Observable(function (observer) {
            var sortedTypesLastSyncs = Object.values(_this.schema.namespaces).reduce(function (map, namespace) {
                var e_1, _a;
                try {
                    for (var _b = __values(Array.from(namespace.modelTopologicalOrdering.keys())), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var modelName = _c.value;
                        var typeLastSync = typesLastSync.get(namespace.models[modelName]);
                        map.set(namespace.models[modelName], typeLastSync);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                return map;
            }, new Map());
            var allModelsReady = Array.from(sortedTypesLastSyncs.entries())
                .filter(function (_a) {
                var _b = __read(_a, 1), syncable = _b[0].syncable;
                return syncable;
            })
                .map(function (_a) {
                var _b = __read(_a, 2), modelDefinition = _b[0], _c = __read(_b[1], 2), namespace = _c[0], lastSync = _c[1];
                return __awaiter(_this, void 0, void 0, function () {
                    var done, nextToken, startedAt, items, recordsReceived, filter, parents, promises, promise;
                    var _this = this;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                done = false;
                                nextToken = null;
                                startedAt = null;
                                items = null;
                                recordsReceived = 0;
                                filter = this.graphqlFilterFromPredicate(modelDefinition);
                                parents = this.schema.namespaces[namespace].modelTopologicalOrdering.get(modelDefinition.name);
                                promises = parents.map(function (parent) {
                                    return parentPromises.get(namespace + "_" + parent);
                                });
                                promise = new Promise(function (res) { return __awaiter(_this, void 0, void 0, function () {
                                    var limit;
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0: return [4 /*yield*/, Promise.all(promises)];
                                            case 1:
                                                _b.sent();
                                                _b.label = 2;
                                            case 2:
                                                if (!processing) {
                                                    return [2 /*return*/];
                                                }
                                                limit = Math.min(maxRecordsToSync - recordsReceived, syncPageSize);
                                                return [4 /*yield*/, this.retrievePage(modelDefinition, lastSync, nextToken, limit, filter)];
                                            case 3:
                                                (_a = _b.sent(), items = _a.items, nextToken = _a.nextToken, startedAt = _a.startedAt);
                                                recordsReceived += items.length;
                                                done = nextToken === null || recordsReceived >= maxRecordsToSync;
                                                observer.next({
                                                    namespace: namespace,
                                                    modelDefinition: modelDefinition,
                                                    items: items,
                                                    done: done,
                                                    startedAt: startedAt,
                                                    isFullSync: !lastSync,
                                                });
                                                _b.label = 4;
                                            case 4:
                                                if (!done) return [3 /*break*/, 2];
                                                _b.label = 5;
                                            case 5:
                                                res();
                                                return [2 /*return*/];
                                        }
                                    });
                                }); });
                                parentPromises.set(namespace + "_" + modelDefinition.name, promise);
                                return [4 /*yield*/, promise];
                            case 1:
                                _d.sent();
                                return [2 /*return*/];
                        }
                    });
                });
            });
            Promise.all(allModelsReady).then(function () {
                observer.complete();
            });
            return function () {
                processing = false;
            };
        });
        return observable;
    };
    return SyncProcessor;
}());
export { SyncProcessor };
//# sourceMappingURL=sync.js.map