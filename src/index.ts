import {computed, observable, action} from 'mobx'

type AsyncResolve = (value: any) => any
type AsyncReject = (error: any) => any
type AsyncFunction = (resolve: AsyncResolve, reject: AsyncReject) => void
type AsyncEventType = 'resolve' | 'reject' | 'update'
type AsyncEvent = (value: any, BREAK: symbol) => any
type AsyncEvents = Set<AsyncEvent>
type AsyncEventList = { [key: string]: AsyncEvents }
type AsyncOptions = {
  request?: AsyncFunction
  timeout?: number
  loading?: boolean
  loaded?: boolean
  events?: AsyncEventList
  default?: any | ((a: Async) => any)
  response?: any | ((a: Async) => any)
  error?: any | ((a: Async) => any)
  resolve?: AsyncResolve
  reject?: AsyncReject
}

const AsyncBreak = Symbol('break')
const ONCE = Symbol('once')

class Async {
  // TODO: add reset method
  @observable.shallow protected readonly options: AsyncOptions
  protected updated: boolean = true
  protected timeout: number

  constructor (options: AsyncFunction | AsyncOptions = {}) {
    this.options = typeof options === 'function' ? {request: options} : options
    this.update()
  }

  update (timeout: number = this.options.timeout): this {
    const {options} = this
    if (timeout && this.timeout + timeout > Date.now()) return this
    if (options.loading === true) return this
    this.updated = false
    options.loading = true
    return this
  }

  protected call () {
    if (this.options.loading && !this.updated) {
      const {options} = this
      this.updated = true
      this.trigger('update')
      if ('request' in options) {
        options.request(this.resolve, this.reject)
      }
    }
  }

  @action readonly resolve = (response?): this => {
    const {options} = this
    if (options.resolve) {
      response = options.resolve(response)
    }
    options.loading = false
    options.loaded = true
    options.response = response
    options.error = undefined
    this.timeout = Date.now()
    this.trigger('resolve', response)
    return this
  }

  @action readonly reject = (error?): this => {
    const {options} = this
    if (options.reject) {
      error = options.reject(error)
    }
    options.loading = false
    options.error = error
    this.trigger('reject', error)
    return this
  }

  @computed get loading (): boolean {
    this.call()
    return this.options.loading || false
  }
  @computed get loaded (): boolean {
    this.call()
    return this.options.loaded || false
  }
  @computed get default (): any {
    this.call()
    return typeof this.options.default === 'function' ? this.options.default(this) : this.options.default
  }
  @computed get response (): any {
    this.call()
    return typeof this.options.response === 'function' ? this.options.response(this) : this.options.response
  }
  @computed get error (): any {
    this.call()
    return typeof this.options.error === 'function' ? this.options.error(this) : this.options.error
  }
  @computed get value (): any {
    this.call()
    return 'response' in this.options ? this.response : this.default
  }

  // event system
  get events (): AsyncEventList {
    if (!this.options.events) {
      this.options.events = {}
    }
    return this.options.events
  }
  on (event: AsyncEventType | string, callback: AsyncEvent): this {
    const {events} = this
    if (!events[event]) {
      events[event] = new Set()
    }
    callback[ONCE] = false
    events[event].add(callback)
    return this
  }
  once (event: AsyncEventType | string, callback: AsyncEvent): this {
    const {events} = this
    if (!events[event]) {
      events[event] = new Set()
    }
    callback[ONCE] = true
    events[event].add(callback)
    return this
  }
  off (event: AsyncEventType | string, callback: AsyncEvent): this {
    const {options} = this
    if (!options.events || !options.events[event]) return this
    options.events[event].delete(callback)
    return this
  }
  trigger (event: AsyncEventType | string, details?): this {
    const {options} = this
    if (!options.events || !options.events[event]) return this
    for (const listener of options.events[event]) {
      if(listener[ONCE]) {
        options.events[event].delete(listener)
      }
      if (listener(details, AsyncBreak) === AsyncBreak) break
    }
    return this
  }

  // promise system
  then (resolve: AsyncResolve, reject?: boolean | AsyncReject, reusable?: boolean): Async {
    this.call()
    if (reject === true) {
      reject = undefined
      reusable = true
    }

    const async = new Async()

    const onResolve = resolve ? data => {
      const result = resolve(data)
      if (result instanceof Promise) {
        result.then(async.resolve, async.reject)
      } else if (result instanceof Async) {
        if (!result.loading) {
          if (result.error === undefined) {
            async.resolve(result.response)
          } else {
            async.reject(result.error)
          }
        } else {
          result.once('resolve', async.resolve)
          result.once('reject', async.reject)
        }
      } else {
        async.resolve(result)
      }
    } : async.resolve
    const onReject = reject ? err => {
      // @ts-ignore
      const result = reject(err)
      if (result instanceof Promise) {
        result.then(async.resolve, async.reject)
      } if (result instanceof Async) {
        if (!result.loading) {
          if (result.error === undefined) {
            async.resolve(result.response)
          } else {
            async.reject(result.error)
          }
        } else {
          result.once('resolve', async.resolve)
          result.once('reject', async.reject)
        }
      } else {
        async.reject(result)
      }
    } : async.reject

    const {loading} = this.options

    if (!loading) {
      if (this.options.error) {
        onReject(this.options.error)
      } else {
        onResolve(this.options.response)
      }
    }
    if (reusable) {
      this.on('update', async.update.bind(async))
      this.on('resolve', onResolve)
      this.on('reject', onReject)
      async.update = this.update.bind(this)
    } else if (loading) {
      this.once('update', async.update.bind(async))
      this.once('resolve', onResolve)
      this.once('reject', onReject)
      async.update = this.update.bind(this)
    }
    return async
  }
  catch (reject: AsyncReject, reusable?: boolean): Async {
    return this.then(undefined, reject, reusable)
  }
  finally (fin: AsyncResolve | AsyncReject, reusable?: boolean): Async {
    return this.then(fin, fin, reusable)
  }
}

export default Async

export {
  AsyncBreak,
  AsyncOptions,
  AsyncEventList,
  AsyncEvents,
  AsyncEvent,
  AsyncEventType,
  AsyncFunction,
  AsyncReject,
  AsyncResolve,
}
