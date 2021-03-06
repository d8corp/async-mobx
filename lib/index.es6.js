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
            if (!options.keepError) {
                options.error = undefined;
            }
            this.timeout = Date.now();
            this.trigger('resolve');
            return this;
        };
        this.reject = (error) => {
            const { options } = this;
            if (options.reject) {
                error = options.reject(error);
            }
            options.loading = false;
            options.error = error;
            if (!options.keepResponse) {
                options.response = undefined;
            }
            this.trigger('reject');
            return this;
        };
        this.options = typeof options === 'function' ? { request: options } : options;
        this.update();
    }
    reset() {
        const { options } = this;
        options.response = options.default;
        options.error = undefined;
    }
    update(timeout = this.options.timeout) {
        const { options } = this;
        if (!options.request)
            return this;
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
    startEvent(event) {
        const { events } = this;
        if (!events[event]) {
            events[event] = new Set();
        }
    }
    on(event, callback) {
        const { events } = this;
        this.startEvent(event);
        callback[ONCE] = false;
        events[event].add(callback);
        return this;
    }
    once(event, callback) {
        const { events } = this;
        this.startEvent(event);
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
    trigger(event) {
        const { options } = this;
        if (!options.events || !options.events[event])
            return this;
        for (const listener of options.events[event]) {
            if (listener[ONCE]) {
                options.events[event].delete(listener);
            }
            if (listener() === AsyncBreak) {
                break;
            }
        }
        return this;
    }
    // promise system
    then(resolve, reject) {
        const { options } = this;
        if (options.loading) ;
        else {
            this.response;
        }
        return new Promise((res, rej) => {
            const finish = () => {
                if (this.error) {
                    rej(this.error);
                }
                else {
                    res(this.value);
                }
            };
            if (this.loading) {
                const listener = () => {
                    finish();
                    this.off('resolve', listener);
                    this.off('reject', listener);
                };
                this.once('resolve', listener);
                this.once('reject', listener);
            }
            else {
                finish();
            }
        }).then(resolve, reject);
    }
    catch(reject) {
        return this.then(undefined, reject);
    }
    finally(fin) {
        return this.then(fin, fin);
    }
}
__decorate([
    observable.shallow
], Async.prototype, "options", void 0);
__decorate([
    action
], Async.prototype, "reset", null);
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
