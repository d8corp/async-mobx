import { __decorate } from 'tslib';
import { observable, action, computed } from 'mobx';

const AsyncBreak = Symbol('break');
const ONCE = Symbol('once');
class Async {
    constructor(options = {}) {
        this.updated = true;
        this.resolve = (response) => {
            const { options } = this;
            if (options.resolve) {
                response = options.resolve(response);
            }
            options.loading = false;
            options.loaded = true;
            options.response = response;
            options.error = undefined;
            this.timeout = Date.now();
            this.trigger('resolve', response);
            return this;
        };
        this.reject = (error) => {
            const { options } = this;
            if (options.reject) {
                error = options.reject(error);
            }
            options.loading = false;
            options.error = error;
            this.trigger('reject', error);
            return this;
        };
        this.options = typeof options === 'function' ? { request: options } : options;
        this.update();
    }
    update(timeout = this.options.timeout) {
        const { options } = this;
        if (timeout && this.timeout + timeout > Date.now())
            return this;
        if (options.loading === true)
            return this;
        this.updated = false;
        options.loading = true;
        return this;
    }
    call() {
        if (this.options.loading && !this.updated) {
            const { options } = this;
            this.updated = true;
            this.trigger('update');
            if ('request' in options) {
                options.request(this.resolve, this.reject);
            }
        }
    }
    get loading() {
        this.call();
        return this.options.loading || false;
    }
    get loaded() {
        this.call();
        return this.options.loaded || false;
    }
    get default() {
        this.call();
        return typeof this.options.default === 'function' ? this.options.default(this) : this.options.default;
    }
    get response() {
        this.call();
        return typeof this.options.response === 'function' ? this.options.response(this) : this.options.response;
    }
    get error() {
        this.call();
        return typeof this.options.error === 'function' ? this.options.error(this) : this.options.error;
    }
    get value() {
        this.call();
        return 'response' in this.options ? this.response : this.default;
    }
    // event system
    get events() {
        if (!this.options.events) {
            this.options.events = {};
        }
        return this.options.events;
    }
    on(event, callback) {
        const { events } = this;
        if (!events[event]) {
            events[event] = new Set();
        }
        callback[ONCE] = false;
        events[event].add(callback);
        return this;
    }
    once(event, callback) {
        const { events } = this;
        if (!events[event]) {
            events[event] = new Set();
        }
        callback[ONCE] = true;
        events[event].add(callback);
        return this;
    }
    off(event, callback) {
        const { options } = this;
        if (!options.events || !options.events[event])
            return this;
        options.events[event].delete(callback);
        return this;
    }
    trigger(event, details) {
        const { options } = this;
        if (!options.events || !options.events[event])
            return this;
        for (const listener of options.events[event]) {
            if (listener[ONCE]) {
                options.events[event].delete(listener);
            }
            if (listener(details, AsyncBreak) === AsyncBreak)
                break;
        }
        return this;
    }
    // promise system
    then(resolve, reject, reusable) {
        this.call();
        if (reject === true) {
            reject = undefined;
            reusable = true;
        }
        const async = new Async();
        const onResolve = resolve ? data => {
            const result = resolve(data);
            if (result instanceof Promise) {
                result.then(async.resolve, async.reject);
            }
            else if (result instanceof Async) {
                if (!result.loading) {
                    if (result.error === undefined) {
                        async.resolve(result.response);
                    }
                    else {
                        async.reject(result.error);
                    }
                }
                else {
                    result.once('resolve', async.resolve);
                    result.once('reject', async.reject);
                }
            }
            else {
                async.resolve(result);
            }
        } : async.resolve;
        const onReject = reject ? err => {
            // @ts-ignore
            const result = reject(err);
            if (result instanceof Promise) {
                result.then(async.resolve, async.reject);
            }
            if (result instanceof Async) {
                if (!result.loading) {
                    if (result.error === undefined) {
                        async.resolve(result.response);
                    }
                    else {
                        async.reject(result.error);
                    }
                }
                else {
                    result.once('resolve', async.resolve);
                    result.once('reject', async.reject);
                }
            }
            else {
                async.reject(result);
            }
        } : async.reject;
        const { loading } = this.options;
        if (!loading) {
            if (this.options.error) {
                onReject(this.options.error);
            }
            else {
                onResolve(this.options.response);
            }
        }
        if (reusable) {
            this.on('update', async.update.bind(async));
            this.on('resolve', onResolve);
            this.on('reject', onReject);
            async.update = this.update.bind(this);
        }
        else if (loading) {
            this.once('update', async.update.bind(async));
            this.once('resolve', onResolve);
            this.once('reject', onReject);
            async.update = this.update.bind(this);
        }
        return async;
    }
    catch(reject, reusable) {
        return this.then(undefined, reject, reusable);
    }
    finally(fin, reusable) {
        return this.then(fin, fin, reusable);
    }
}
__decorate([
    observable.shallow
], Async.prototype, "options", void 0);
__decorate([
    action
], Async.prototype, "resolve", void 0);
__decorate([
    action
], Async.prototype, "reject", void 0);
__decorate([
    computed
], Async.prototype, "loading", null);
__decorate([
    computed
], Async.prototype, "loaded", null);
__decorate([
    computed
], Async.prototype, "default", null);
__decorate([
    computed
], Async.prototype, "response", null);
__decorate([
    computed
], Async.prototype, "error", null);
__decorate([
    computed
], Async.prototype, "value", null);

export default Async;
export { AsyncBreak };
