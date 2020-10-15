import {computed, observable, action} from 'mobx'

type AsyncValue <V = any> = V | (() => V)

type AsyncResolve <V = any> = (value: AsyncValue<V>) => AsyncValue<V>
type AsyncReject <E = any> = (error: AsyncValue<E>) => AsyncValue<E>

type AsyncFunction <V = any, E = any> = (resolve: AsyncResolve<V>, reject: AsyncReject<E>) => void

type AsyncEvent <V = any> = (value: V, BREAK: symbol) => any
type AsyncEvents = Set<AsyncEvent>
type AsyncEventList = { [key: string]: AsyncEvents }
type AsyncOptions <V = any, E = any> = {
  request?: AsyncFunction <V, E>
  timeout?: number
  loading?: boolean
  loaded?: boolean
  events?: AsyncEventList
  default?: V | ((a: Async) => V)
  response?: V | ((a: Async) => V)
  error?: E | ((a: Async) => E)
  resolve?: AsyncResolve<V>
  reject?: AsyncReject<E>
  keepResponse?: boolean
  keepError?: boolean
}

const AsyncBreak = Symbol('break')
const ONCE = Symbol('once')

class Async <V = any, E = any> {
  @observable.shallow protected readonly options: AsyncOptions
  protected updated: boolean = true
  protected timeout: number

  constructor (options: AsyncFunction<V, E> | AsyncOptions <V, E> = {}) {
    this.options = typeof options === 'function' ? {request: options} : options
    this.update()
  }

  @action reset () {
    const {options} = this
    options.response = options.default
    options.error = undefined
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

  @action readonly resolve = (response?: AsyncValue<V>): this => {
    const {options} = this
    if (options.resolve) {
      response = options.resolve(response)
    }
    options.loading = false
    options.loaded = true
    options.response = response
    if (!options.keepError) {
      options.error = undefined
    }
    this.timeout = Date.now()
    this.trigger('resolve', response)
    return this
  }

  @action readonly reject = (error?: AsyncValue<E>): this => {
    const {options} = this
    if (options.reject) {
      error = options.reject(error)
    }
    options.loading = false
    options.error = error
    if (!options.keepResponse) {
      options.response = undefined
    }
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
  @computed get default (): V {
    this.call()
    return typeof this.options.default === 'function' ? this.options.default(this) : this.options.default
  }
  @computed get response (): V {
    this.call()
    return typeof this.options.response === 'function' ? this.options.response(this) : this.options.response
  }
  @computed get error (): E {
    this.call()
    return typeof this.options.error === 'function' ? this.options.error(this) : this.options.error
  }
  @computed get value (): V {
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

  on (event: 'resolve', callback: AsyncEvent<V>): this
  on (event: 'reject', callback: AsyncEvent<E>): this
  on (event: 'update', callback: AsyncEvent<undefined>): this
  on (event: string, callback: AsyncEvent): this {
    const {events} = this
    if (!events[event]) {
      events[event] = new Set()
    }
    callback[ONCE] = false
    events[event].add(callback)
    return this
  }

  once (event: 'resolve', callback: AsyncEvent<V>): this
  once (event: 'reject', callback: AsyncEvent<E>): this
  once (event: 'update', callback: AsyncEvent<undefined>): this
  once (event:string, callback: AsyncEvent): this {
    const {events} = this
    if (!events[event]) {
      events[event] = new Set()
    }
    callback[ONCE] = true
    events[event].add(callback)
    return this
  }

  off (event: 'resolve', callback: AsyncEvent<V>): this
  off (event: 'reject', callback: AsyncEvent<E>): this
  off (event: 'update', callback: AsyncEvent<undefined>): this
  off (event: string, callback: AsyncEvent): this {
    const {options} = this
    if (!options.events || !options.events[event]) return this
    options.events[event].delete(callback)
    return this
  }

  trigger (event: 'resolve', details?: AsyncValue<V>): this
  trigger (event: 'reject', details?: AsyncValue<E>): this
  trigger (event: 'update'): this
  trigger (event: string, details?): this {
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
  AsyncFunction,
  AsyncReject,
  AsyncResolve,
}
