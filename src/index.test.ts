import Async from './'
import {autorun} from 'mobx'

describe('Async', () => {
  describe('options', () => {
    describe('empty', () => {
      test('simple', () => {
        new Async()
      })
      test('object', () => {
        new Async<string>({})
      })
      test('async await', async () => {
        await new Async<string>()
      })
    })
    describe('request', () => {
      test('simple', () => {
        const async = new Async<string>(resolve => resolve('1'))
        expect(async.value).toBe('1')
      })
      test('options', () => {
        const async = new Async<string>({request: resolve => resolve('1')})
        expect(async.value).toBe('1')
      })
      test('deferred', async () => {
        let i = 0
        const async = new Async<number>(resolve => resolve(() => i++))
        expect(i).toBe(0)
        expect(await async).toBe(0)
        expect(i).toBe(1)
      })
    })
  })
  describe('api', () => {
    describe('constructor', () => {
      test('without arguments', () => {
        new Async()
      })
      test('argument is a function', () => {
        new Async(() => {})
      })
      test('argument is an object', () => {
        new Async({})
      })

      test('resolve', async () => {
        expect(await new Async(resolve => resolve(1))).toBe(1)
      })
      test('reject', () => {
        expect(new Async((resolve, reject) => reject(1)).error).toBe(1)
      })
      test('result inside Async', () => {
        const test = new Async(resolve => resolve(test))
        expect(test.value).toBe(test)
      })
    })
    describe('loading', () => {
      test('complete', () => {
        expect('loading' in new Async()).toBe(true)
      })
      test('async', async () => {
        const async = new Async(resolve => setTimeout(resolve))
        expect(async.loading).toBe(true)
        await async
        expect(async.loading).toBe(false)
      })
      test('sync', () => {
        const async = new Async(resolve => resolve(true))
        expect(async.loading).toBe(false)
      })
    })
    describe('loaded', () => {
      test('complete', () => {
        expect('loaded' in new Async()).toBe(true)
      })
      test('async', async () => {
        const async = new Async(resolve => setTimeout(resolve))
        expect(async.loaded).toBe(false)
        await async
        expect(async.loaded).toBe(true)
      })
      test('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.loaded).toBe(true)
      })
    })
    describe('value', () => {
      test('complete', () => {
        expect('value' in new Async()).toBe(true)
      })
      test('async', async () => {
        const async = new Async(resolve => setTimeout(() => resolve('test')))
        expect(async.value).toBe(undefined)
        await async
        expect(async.value).toBe('test')
      })
      test('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.value).toBe('test')
      })
      test('getter', () => {
        let i = 0
        const async = new Async(resolve => resolve(() => ++i && 'test'))
        expect(i).toBe(0)
        expect(async.value).toBe('test')
        expect(i).toBe(1)
        expect(async.value).toBe('test')
        expect(i).toBe(2)
      })
    })
    describe('error', () => {
      test('complete', () => {
        expect('error' in new Async()).toBe(true)
      })
      test('async', async () => {
        const async = new Async((resolve, reject) => setTimeout(() => reject('test')))
        expect(async.error).toBe(undefined)
        let test = false
        try {
          await async
        } catch (e) {
          test = true
          expect(e).toBe('test')
        }
        expect(test).toBe(true)
        expect(async.error).toBe('test')
      })
      test('sync', () => {
        const async = new Async((resolve, reject) => reject('test'))
        expect(async.error).toBe('test')
      })
      test('getter', () => {
        let i = 0
        const async = new Async((resolve, reject) => reject(() => ++i && 'test'))
        expect(i).toBe(0)
        expect(async.error).toBe('test')
        expect(i).toBe(1)
        expect(async.error).toBe('test')
        expect(i).toBe(2)
      })
    })
    describe('default', () => {
      test('complete', () => {
        expect('default' in new Async()).toBe(true)
      })
      test('as option', () => {
        const async = new Async({default: 1})
        expect(async.default).toBe(1)
      })
      test('async', async () => {
        const async = new Async({
          default: 1,
          request: resolve => setTimeout(() => resolve(2))
        })
        expect(async.value).toBe(1)
        await async
        expect(async.value).toBe(2)
      })
      test('sync', () => {
        const async = new Async<any>({
          default: 1,
          request: resolve => resolve('test')
        })
        expect(async.value).toBe('test')
      })
      test('getter', () => {
        let i = 0
        const async = new Async({default: () => ++i})
        expect(i).toBe(0)
        expect(async.value).toBe(1)
        expect(i).toBe(1)
        expect(async.value).toBe(2)
        expect(i).toBe(2)
      })
    })
    describe('response', () => {
      test('complete', () => {
        expect('response' in new Async()).toBe(true)
      })
      test('async', async () => {
        const async = new Async<any>({
          default: 1,
          request: resolve => setTimeout(() => resolve('test'))
        })
        expect(async.response).toBe(undefined)
        expect(async.value).toBe(1)
        expect(await async).toBe('test')
        expect(async.response).toBe('test')
        expect(async.value).toBe('test')
      })
      test('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.response).toBe('test')
      })
      test('getter', () => {
        let i = 0
        const async = new Async(resolve => resolve(() => ++i))
        expect(i).toBe(0)
        expect(async.response).toBe(1)
        expect(i).toBe(1)
        expect(async.response).toBe(2)
        expect(i).toBe(2)
      })
    })
    describe('update', () => {
      test('complete', () => {
        expect('update' in new Async()).toBe(true)
      })
      test('async', async () => {
        let i = 0
        const async = new Async(resolve => setTimeout(() => resolve(i++)))
        expect(async.value).toBe(undefined)
        expect(await async).toBe(0)
        expect(async.value).toBe(0)
        expect(async.value).toBe(0)
        async.update()
        expect(async.value).toBe(0)
        expect(async.value).toBe(0)
        expect(await async).toBe(1)
        expect(async.value).toBe(1)
        expect(async.value).toBe(1)
        async.update()
        expect(await async).toBe(2)
        expect(async.value).toBe(2)
        expect(async.value).toBe(2)
      })
      test('sync', () => {
        let i = 0
        const async = new Async(resolve => resolve(i++))
        expect(async.value).toBe(0)
        expect(async.value).toBe(0)
        async.update()
        expect(async.value).toBe(1)
        expect(async.value).toBe(1)
        async.update()
        expect(async.value).toBe(2)
        expect(async.value).toBe(2)
      })
      test('loading for empty Async', () => {
        const async = new Async()
        expect(async.loading).toBe(false)
        async.resolve(1)
        expect(async.loading).toBe(false)
        expect(async.value).toBe(1)
        async.update()
        expect(async.loading).toBe(false)
      })
    })
    describe('resolve', () => {
      test('complete', () => {
        expect('resolve' in new Async()).toBe(true)
      })
      test('call the method', () => {
        const async = new Async()
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.response).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.resolve('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.response).toBe('test')
        expect(async.error).toBe(undefined)
      })
      test('resolve after reject', () => {
        const async = new Async()
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.reject('error')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe('error')
        async.resolve('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.error).toBe(undefined)
      })
      test('keepError', () => {
        const async = new Async({keepError: true})
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.reject('error')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe('error')
        async.resolve('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.error).toBe('error')
      })
    })
    describe('reject', () => {
      test('complete', () => {
        expect('reject' in new Async()).toBe(true)
      })
      test('call the method', () => {
        const async = new Async()
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.response).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.reject('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.response).toBe(undefined)
        expect(async.error).toBe('test')
      })
      test('reject after resolve', () => {
        const async = new Async()
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.resolve('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.error).toBe(undefined)
        async.reject('error')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe('error')
      })
      test('keepResponse', () => {
        const async = new Async({keepResponse: true})
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(false)
        expect(async.value).toBe(undefined)
        expect(async.error).toBe(undefined)
        async.resolve('test')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.error).toBe(undefined)
        async.reject('error')
        expect(async.loading).toBe(false)
        expect(async.loaded).toBe(true)
        expect(async.value).toBe('test')
        expect(async.error).toBe('error')
      })
    })
    describe('on', () => {
      test('complete', () => {
        const async = new Async()
        expect('on' in async).toBe(true)
      })
      test('returns this', () => {
        const async = new Async()
        expect(async.on('resolve', () => {})).toBe(async)
      })
      test('resolve', () => {
        const async = new Async()
        let test = false
        async.on('resolve', () => test = async.value)
        expect(test).toBe(false)
        async.resolve('test')
        expect(test).toBe('test')
        async.resolve('test1')
        expect(test).toBe('test1')
      })
      test('reject', () => {
        const async = new Async()
        let test = false
        async.on('reject', () => test = async.error)
        expect(test).toBe(false)
        async.reject('test')
        expect(test).toBe('test')
        async.reject('test1')
        expect(test).toBe('test1')
      })
      test('update', () => {
        const async1 = new Async()
        let test1 = false
        async1.on('update', () => test1 = true)
        expect(test1).toBe(false)
        async1.update()
        expect(test1).toBe(false)

        const async = new Async(resolve => resolve(1))
        let test2 = 0
        async.on('update', () => test2++)
        expect(test2).toBe(0)
        async.update()
        expect(async.loading).toBe(false)
        expect(test2).toBe(1)
        async.update()
        expect(async.loading).toBe(false)
        expect(test2).toBe(2)
      })
    })
    describe('once', () => {
      test('complete', () => {
        const async = new Async()
        expect('once' in async).toBe(true)
      })
      test('returns this', () => {
        const async = new Async()
        expect(async.once('resolve', () => {})).toBe(async)
      })
      test('resolve', () => {
        const async = new Async()
        let i = 0
        async.once('resolve', () => i = async.value)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(1)
        async.resolve(2)
        expect(i).toBe(1)
      })
      test('reject', () => {
        const async = new Async()
        let i = 0
        async.once('reject', () => i = async.error)
        expect(i).toBe(0)
        async.reject(1)
        expect(i).toBe(1)
        async.reject(2)
        expect(i).toBe(1)
      })
      test('update', () => {
        const async1 = new Async()
        let test1 = false
        async1.once('update', () => test1 = true)
        expect(test1).toBe(false)
        async1.update()
        expect(test1).toBe(false)

        const async = new Async(resolve => resolve(1))
        let test2 = 0
        async.once('update', () => test2++)
        expect(test2).toBe(0)
        async.update()
        expect(async.loading).toBe(false)
        expect(test2).toBe(1)
        async.update()
        expect(async.loading).toBe(false)
        expect(test2).toBe(1)
      })
    })
    describe('off', () => {
      test('complete', () => {
        const async = new Async()
        expect('off' in async).toBe(true)
      })
      test('returns this', () => {
        const async = new Async()
        expect(async.off('resolve', () => {})).toBe(async)
      })
      test('on', () => {
        const async = new Async()
        let i = 0
        const listener = () => i = async.value
        async.on('resolve', listener)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(1)
        async.off('resolve', listener)
        async.resolve(2)
        expect(i).toBe(1)
      })
      test('once', () => {
        const async = new Async()
        let i = 0
        const listener = () => i = async.value
        async.once('resolve', listener)
        async.off('resolve', listener)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(0)
      })
    })
    describe('events', () => {
      test('complete', () => {
        const async = new Async()
        expect('events' in async).toBe(true)
      })
      test('returns object', () => {
        const async = new Async()
        expect(typeof async.events).toBe('object')
        expect(Object.keys(async.events)).toEqual([])
      })
      test('on', () => {
        const async = new Async()
        const listener = () => {}
        expect('resolve' in async.events).toBe(false)
        async.on('resolve', listener)
        expect('resolve' in async.events).toBe(true)
        expect(async.events.resolve.size).toBe(1)
        expect(async.events.resolve.has(listener)).toBe(true)
      })
      test('once', () => {
        const async = new Async()
        const listener = () => {}
        expect('resolve' in async.events).toBe(false)
        async.once('resolve', listener)
        expect('resolve' in async.events).toBe(true)
        expect(async.events.resolve.size).toBe(1)
        expect(async.events.resolve.has(listener)).toBe(true)
        async.resolve()
        expect('resolve' in async.events).toBe(true)
        expect(async.events.resolve.size).toBe(0)
      })
    })
    describe('then', () => {
      test('complete', () => {
        const async = new Async()
        expect('then' in async).toBe(true)
      })
      test('returns Promise', () => {
        const async = new Async()
        expect(async.then()).toBeInstanceOf(Promise)
      })
    })
    describe('catch', () => {
      test('complete', () => {
        const async = new Async()
        expect('catch' in async).toBe(true)
      })
      test('returns Promise', () => {
        const async = new Async()
        expect(async.catch()).toBeInstanceOf(Promise)
      })
    })
    describe('finally', () => {
      test('complete', () => {
        const async = new Async()
        expect('finally' in async).toBe(true)
      })
      test('returns Async', () => {
        const async = new Async()
        expect(async.finally()).toBeInstanceOf(Promise)
      })
    })
  })
  describe('autorun', () => {
    describe('value', () => {
      test('sync', () => {
        const async = new Async()
        const test = []
        autorun(() => test.push(async.value))
        expect(test.length).toBe(1)
        expect(test[0]).toBe(undefined)
        async.resolve(1)
        expect(test.length).toBe(2)
        expect(test[1]).toBe(1)
        async.resolve(2)
        expect(test.length).toBe(3)
        expect(test[2]).toBe(2)
      })
      test('async', async () => {
        let i = 1
        const async = new Async(resolve => setTimeout(() => resolve(i++)))
        const test = []
        autorun(() => test.push(async.value))
        expect(test.length).toBe(1)
        expect(test[0]).toBe(undefined)
        await async
        expect(test.length).toBe(2)
        expect(test[1]).toBe(1)
        async.update()
        expect(test.length).toBe(2)
        await async
        expect(test.length).toBe(3)
        expect(test[2]).toBe(2)
        expect(async.value).toBe(2)
        async.update()
        expect(test.length).toBe(3)
        await async
        expect(test.length).toBe(4)
        expect(test[3]).toBe(3)
        expect(async.value).toBe(3)
      })
      test('function', () => {
        let i = 0
        const async = new Async(resolve => resolve(() => {
          i++
          return 'test'
        }))
        autorun(() => async.value)
        expect(async.value).toBe('test')
        expect(i).toBe(1)
        expect(async.value).toBe('test')
        expect(i).toBe(1)
      })
    })
    describe('error', () => {
      test('sync', () => {
        const async = new Async()
        const test = []
        autorun(() => test.push(async.error))
        expect(test.length).toBe(1)
        expect(test[0]).toBe(undefined)
        async.reject(1)
        expect(test.length).toBe(2)
        expect(test[1]).toBe(1)
      })
      test('async', async () => {
        const async = new Async((resolve, reject) => setTimeout(() => reject(1)))
        const test = []
        autorun(() => test.push(async.error))
        expect(test.length).toBe(1)
        expect(test[0]).toBe(undefined)
        try {
          await async
          expect(true).toBe(false)
        } catch (e) {
          expect(true).toBe(true)
        }
        expect(test.length).toBe(2)
        expect(test[1]).toBe(1)
      })
    })
  })
  describe('types', () => {
    test('resolve', () => {
      const test = new Async<{test: number}>(resolve => resolve({test: 1}))
      const test1 = new Async<{test: number}>(resolve => resolve(() => ({test: 1})))
      const test2 = new Async<{test: number}>({
        request: resolve => resolve({test: 1})
      })
      const test3 = new Async<{test: number}>({
        request: resolve => resolve(() => ({test: 1}))
      })
      const test4 = new Async<{test: number}>({
        response: {test: 1},
        default: {test: 1}
      })
      const test5 = new Async<{test: number}>({
        response: () => ({test: 1}),
        default: () => ({test: 1})
      })
      const test6 = new Async<{test: number}>({
        resolve: () => ({test: 1})
      })
      const test7 = new Async<{test: number}>({
        resolve: () => () => ({test: 1})
      })
      const test8 = new Async<{test: number}>({
        resolve: value => value
      })
      test.resolve({test: 1})
      test1.resolve(() => ({test: 1}))
    })
    test('reject', () => {
      const test = new Async<string, {test: number}>((resolve, reject) => reject({test: 1}))
      const test1 = new Async<string, {test: number}>((resolve, reject) => reject(() => ({test: 1})))
      const test2 = new Async<string, {test: number}>({
        request: (resolve, reject) => reject({test: 1})
      })
      const test3 = new Async<string, {test: number}>({
        request: (resolve, reject) => reject(() => ({test: 1}))
      })
      const test4 = new Async<string, {test: number}>({
        error: {test: 1}
      })
      const test5 = new Async<string, {test: number}>({
        error: () => ({test: 1})
      })
      const test6 = new Async<string, {test: number}>({
        reject: () => ({test: 1})
      })
      const test7 = new Async<string, {test: number}>({
        reject: () => () => ({test: 1})
      })
      const test8 = new Async<string, {test: number}>({
        reject: value => value
      })
      test.reject({test: 1})
      test1.reject(() => ({test: 1}))
    })
    test('async away', async () => {
      const test1 = await new Async<{test: number}>()
      const test2 = await new Async<{test: number}>().then()
      const test3 = await new Async<{test: number}>().catch()
      const test4 = await new Async<{test: number}>().finally()
      expect(test1?.test).toBe(undefined)
      expect(test2?.test).toBe(undefined)
      expect(test3?.test).toBe(undefined)
      expect(test4?.test).toBe(undefined)
    })
  })
})
