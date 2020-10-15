import Async from './'
import {autorun} from 'mobx'

describe('Async', () => {
  describe('api', () => {
    describe('constructor', () => {
      it('without arguments', () => {
        new Async()
      })
      it('argument is a function', () => {
        new Async(() => {})
      })
      it('argument is an object', () => {
        new Async({})
      })

      it('resolve', async () => {
        expect(await new Async(resolve => resolve(1))).toBe(1)
      })
      it('reject', () => {
        expect(new Async((resolve, reject) => reject(1)).error).toBe(1)
      })
      it('result inside Async', () => {
        const test = new Async(resolve => resolve(test))
        expect(test.value).toBe(test)
      })
    })
    describe('loading', () => {
      it('complete', () => {
        expect('loading' in new Async()).toBe(true)
      })
      it('async', async () => {
        const async = new Async(resolve => setTimeout(resolve))
        expect(async.loading).toBe(true)
        await async
        expect(async.loading).toBe(false)
      })
      it('sync', () => {
        const async = new Async(resolve => resolve(true))
        expect(async.loading).toBe(false)
      })
    })
    describe('loaded', () => {
      it('complete', () => {
        expect('loaded' in new Async()).toBe(true)
      })
      it('async', async () => {
        const async = new Async(resolve => setTimeout(resolve))
        expect(async.loaded).toBe(false)
        await async
        expect(async.loaded).toBe(true)
      })
      it('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.loaded).toBe(true)
      })
    })
    describe('value', () => {
      it('complete', () => {
        expect('value' in new Async()).toBe(true)
      })
      it('async', async () => {
        const async = new Async(resolve => setTimeout(() => resolve('test')))
        expect(async.value).toBe(undefined)
        await async
        expect(async.value).toBe('test')
      })
      it('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.value).toBe('test')
      })
      it('getter', () => {
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
      it('complete', () => {
        expect('error' in new Async()).toBe(true)
      })
      it('async', async () => {
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
      it('sync', () => {
        const async = new Async((resolve, reject) => reject('test'))
        expect(async.error).toBe('test')
      })
      it('getter', () => {
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
      it('complete', () => {
        expect('default' in new Async()).toBe(true)
      })
      it('as option', () => {
        const async = new Async({default: 1})
        expect(async.default).toBe(1)
      })
      it('async', async () => {
        const async = new Async({
          default: 1,
          request: resolve => setTimeout(() => resolve(2))
        })
        expect(async.value).toBe(1)
        await async
        expect(async.value).toBe(2)
      })
      it('sync', () => {
        const async = new Async({
          default: 1,
          request: resolve => resolve('test')
        })
        expect(async.value).toBe('test')
      })
      it('getter', () => {
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
      it('complete', () => {
        expect('response' in new Async()).toBe(true)
      })
      it('async', async () => {
        const async = new Async({
          default: 1,
          request: resolve => setTimeout(() => resolve('test'))
        })
        expect(async.response).toBe(undefined)
        expect(async.value).toBe(1)
        expect(await async).toBe('test')
        expect(async.response).toBe('test')
        expect(async.value).toBe('test')
      })
      it('sync', () => {
        const async = new Async(resolve => resolve('test'))
        expect(async.response).toBe('test')
      })
      it('getter', () => {
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
      it('complete', () => {
        expect('update' in new Async()).toBe(true)
      })
      it('async', async () => {
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
      it('sync', () => {
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
      it('loading for empty Async', () => {
        const async = new Async()
        expect(async.loading).toBe(true)
        async.resolve(1)
        expect(async.loading).toBe(false)
        expect(async.value).toBe(1)
        async.update()
        expect(async.loading).toBe(true)
      })
    })
    describe('resolve', () => {
      it('complete', () => {
        expect('resolve' in new Async()).toBe(true)
      })
      it('call the method', () => {
        const async = new Async()
        expect(async.loading).toBe(true)
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
    })
    describe('reject', () => {
      it('complete', () => {
        expect('reject' in new Async()).toBe(true)
      })
      it('call the method', () => {
        const async = new Async()
        expect(async.loading).toBe(true)
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
      it('reject after resolve', () => {
        const async = new Async()
        expect(async.loading).toBe(true)
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
      it('complete', () => {
        const async = new Async()
        expect('on' in async).toBe(true)
      })
      it('returns this', () => {
        const async = new Async()
        expect(async.on('resolve', () => {})).toBe(async)
      })
      it('resolve', () => {
        const async = new Async()
        let test = false
        async.on('resolve', value => test = value)
        expect(test).toBe(false)
        async.resolve('test')
        expect(test).toBe('test')
        async.resolve('test1')
        expect(test).toBe('test1')
      })
      it('reject', () => {
        const async = new Async()
        let test = false
        async.on('reject', err => test = err)
        expect(test).toBe(false)
        async.reject('test')
        expect(test).toBe('test')
        async.reject('test1')
        expect(test).toBe('test1')
      })
      it('update', () => {
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
      it('complete', () => {
        const async = new Async()
        expect('once' in async).toBe(true)
      })
      it('returns this', () => {
        const async = new Async()
        expect(async.once('resolve', () => {})).toBe(async)
      })
      it('resolve', () => {
        const async = new Async()
        let i = 0
        async.once('resolve', value => i = value)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(1)
        async.resolve(2)
        expect(i).toBe(1)
      })
      it('reject', () => {
        const async = new Async()
        let i = 0
        async.once('reject', value => i = value)
        expect(i).toBe(0)
        async.reject(1)
        expect(i).toBe(1)
        async.reject(2)
        expect(i).toBe(1)
      })
      it('update', () => {
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
      it('complete', () => {
        const async = new Async()
        expect('off' in async).toBe(true)
      })
      it('returns this', () => {
        const async = new Async()
        expect(async.off('resolve', () => {})).toBe(async)
      })
      it('on', () => {
        const async = new Async()
        let i = 0
        const listener = value => i = value
        async.on('resolve', listener)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(1)
        async.off('resolve', listener)
        async.resolve(2)
        expect(i).toBe(1)
      })
      it('once', () => {
        const async = new Async()
        let i = 0
        const listener = value => i = value
        async.once('resolve', listener)
        async.off('resolve', listener)
        expect(i).toBe(0)
        async.resolve(1)
        expect(i).toBe(0)
      })
    })
    describe('events', () => {
      it('complete', () => {
        const async = new Async()
        expect('events' in async).toBe(true)
      })
      it('returns object', () => {
        const async = new Async()
        expect(typeof async.events).toBe('object')
        expect(Object.keys(async.events)).toEqual([])
      })
      it('on', () => {
        const async = new Async()
        const listener = () => {}
        expect('resolve' in async.events).toBe(false)
        async.on('resolve', listener)
        expect('resolve' in async.events).toBe(true)
        expect(async.events.resolve.size).toBe(1)
        expect(async.events.resolve.has(listener)).toBe(true)
      })
      it('once', () => {
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
      it('complete', () => {
        const async = new Async()
        expect('then' in async).toBe(true)
      })
      it('returns Async', () => {
        const async = new Async()
        expect(async.then(() => {}) !== async).toBe(true)
        expect(async.then(() => {}) instanceof Async).toBe(true)
      })
      describe('loading', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loading).toBe(false)
          const then = async.then(e => e)
          expect(then.loading).toBe(false)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.then(e => e)
          expect(then.loading).toBe(true)
          await async
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.then(e => e)
          expect(then.loading).toBe(true)
          await then
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
      })
      describe('loaded', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loaded).toBe(true)
          const then = async.then(e => e)
          expect(then.loaded).toBe(true)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.then(e => e)
          expect(then.loaded).toBe(false)
          await async
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.then(e => e)
          expect(then.loaded).toBe(false)
          await then
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
      })
      describe('value', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.value).toBe(1)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(2)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          await async
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          await then
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
      })
      describe('update', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(1)
        })
        it('await main', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await async).toBe(1)
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
        it('reusable sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(e => e + 1,true)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(3)
        })
        it('reusable async', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1,true)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          expect(await then).toBe(3)
        })
      })
      describe('async then', () => {
        it('async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(async e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then.value).toBe(1)
        })
        it('promise', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => new Promise(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.then(e => new Promise(resolve => resolve(e + 1)))
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
        it('Async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => new Async(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.then(e => new Async(resolve => resolve(e + 1)))

          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
      })
      describe('deep', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => e + 1, true)
          const then2 = then1.then(e => e + 1, true)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then1.value).toBe(2)
          expect(then2.value).toBe(3)
          async.update()
          expect(async.value).toBe(2)
          expect(then1.value).toBe(3)
          expect(then2.value).toBe(4)
        })
        it('async', async () => {
          let i = 0
          const async = new Async(async resolve => resolve(i++))
          const then1 = async.then(async e => e + 1)
          const then2 = then1.then(async e => e + 1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await then1).toBe(1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
        })
        it('update', () => {
          let i = 0, j = 0
          const async = new Async(resolve => resolve(i++))
          const then = async.then(e => `i:${e};j:${j++}`, true)
          expect(async.value).toBe(0)
          expect(then.value).toBe('i:0;j:0')
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe('i:1;j:1')
          then.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe('i:2;j:2')
        })
      })
      it('function', () => {
        let i = 0, j = 0
        const async = new Async(resolve => resolve(i++))
        const then = async.then(e => () => `i:${e};j:${j++}`, true)
        expect(async.value).toBe(0)
        expect(then.value).toBe('i:0;j:0')
        async.update()
        expect(async.value).toBe(1)
        expect(then.value).toBe('i:1;j:1')
        then.update()
        expect(async.value).toBe(2)
        expect(then.value).toBe('i:2;j:2')
      })
    })
    describe('catch', () => {
      it('complete', () => {
        const async = new Async()
        expect('catch' in async).toBe(true)
      })
      it('returns Async', () => {
        const async = new Async()
        expect(async.catch(() => {}) !== async).toBe(true)
        expect(async.catch(() => {}) instanceof Async).toBe(true)
      })
      describe('loading', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loading).toBe(false)
          const then = async.catch(e => e)
          expect(then.loading).toBe(false)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.catch(e => e)
          expect(then.loading).toBe(true)
          await async
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.catch(e => e)
          expect(then.loading).toBe(true)
          await then
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
      })
      describe('loaded', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loaded).toBe(true)
          const then = async.catch(e => e)
          expect(then.loaded).toBe(true)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.catch(e => e)
          expect(then.loaded).toBe(false)
          await async
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.catch(e => e)
          expect(then.loaded).toBe(false)
          await then
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
      })
      describe('value', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.value).toBe(1)
          const then = async.catch(e => e + 1)
          expect(then.value).toBe(1)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.catch(e => e + 1)
          expect(then.value).toBe(undefined)
          await async
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.catch(e => e + 1)
          expect(then.value).toBe(undefined)
          await then
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
        })
      })
      describe('error', () => {
        it('sync', () => {
          const async = new Async((resolve, reject) => reject(1))
          expect(async.error).toBe(1)
          const then = async.catch(e => e + 1)
          expect(then.error).toBe(2)
        })
        it('await main', async () => {
          const async = new Async((resolve, reject) => setTimeout(() => reject(1)))
          expect(async.error).toBe(undefined)
          const then = async.catch(e => e + 1)
          expect(then.error).toBe(undefined)
          try {
            await async
          } catch (e) {

          }
          expect(async.error).toBe(1)
          expect(then.error).toBe(2)
        })
        it('await then', async () => {
          const async = new Async((resolve, reject) => setTimeout(() => reject(1)))
          expect(async.error).toBe(undefined)
          const then = async.catch(e => e + 1)
          expect(then.error).toBe(undefined)
          try {
            await then
          } catch (e) {

          }
          expect(async.error).toBe(1)
          expect(then.error).toBe(2)
        })
      })
      describe('update', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(1)
        })
        it('await main', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await async).toBe(1)
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
        it('reusable sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(e => e + 1,true)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(3)
        })
        it('reusable async', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.then(e => e + 1,true)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          expect(await then).toBe(3)
        })
      })
      describe('async then', () => {
        it('async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.then(async e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then.value).toBe(1)
        })
        it('promise', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => new Promise(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.then(e => new Promise(resolve => resolve(e + 1)))
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
        it('Async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => new Async(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.then(e => new Async(resolve => resolve(e + 1)))
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
      })
      describe('deep', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.then(e => e + 1, true)
          const then2 = then1.then(e => e + 1, true)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then1.value).toBe(2)
          expect(then2.value).toBe(3)
          async.update()
          expect(async.value).toBe(2)
          expect(then1.value).toBe(3)
          expect(then2.value).toBe(4)
        })
        it('async', async () => {
          let i = 0
          const async = new Async(async resolve => resolve(i++))
          const then1 = async.then(async e => e + 1)
          const then2 = then1.then(async e => e + 1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await then1).toBe(1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
        })
        it('update', () => {
          let i = 0, j = 0
          const async = new Async(resolve => resolve(i++))
          const then = async.then(e => `i:${e};j:${j++}`, true)
          expect(async.value).toBe(0)
          expect(then.value).toBe('i:0;j:0')
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe('i:1;j:1')
          then.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe('i:2;j:2')
        })
      })
    })
    describe('finally', () => {
      it('complete', () => {
        const async = new Async()
        expect('finally' in async).toBe(true)
      })
      it('returns Async', () => {
        const async = new Async()
        expect(async.finally(() => {}) !== async).toBe(true)
        expect(async.finally(() => {}) instanceof Async).toBe(true)
      })
      describe('loading', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loading).toBe(false)
          const then = async.finally(e => e)
          expect(then.loading).toBe(false)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.finally(e => e)
          expect(then.loading).toBe(true)
          await async
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
        it('await finally', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loading).toBe(true)
          const then = async.then(e => e)
          expect(then.loading).toBe(true)
          await then
          expect(async.loading).toBe(false)
          expect(then.loading).toBe(false)
        })
      })
      describe('loaded', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.loaded).toBe(true)
          const then = async.finally(e => e)
          expect(then.loaded).toBe(true)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.finally(e => e)
          expect(then.loaded).toBe(false)
          await async
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
        it('await then', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.loaded).toBe(false)
          const then = async.finally(e => e)
          expect(then.loaded).toBe(false)
          await then
          expect(async.loaded).toBe(true)
          expect(then.loaded).toBe(true)
        })
      })
      describe('value', () => {
        it('sync', () => {
          const async = new Async(resolve => resolve(1))
          expect(async.value).toBe(1)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(2)
        })
        it('await main', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(undefined)
          await async
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
        it('await finally', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(undefined)
          await then
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
      })
      describe('error', () => {
        it('sync', () => {
          const async = new Async((resolve, reject) => reject(1))
          expect(async.error).toBe(1)
          const then = async.finally(e => e + 1)
          expect(then.error).toBe(2)
        })
        it('await main', async () => {
          const async = new Async((resolve, reject) => setTimeout(() => reject(1)))
          expect(async.error).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.error).toBe(undefined)
          try {
            await async
          } catch (e) {

          }
          expect(async.error).toBe(1)
          expect(then.error).toBe(2)
        })
        it('await finally', async () => {
          const async = new Async((resolve, reject) => setTimeout(() => reject(1)))
          expect(async.error).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.error).toBe(undefined)
          try {
            await then
          } catch (e) {

          }
          expect(async.error).toBe(1)
          expect(then.error).toBe(2)
        })
      })
      describe('update', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(1)
        })
        it('await main', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await async).toBe(1)
          expect(async.value).toBe(1)
          expect(then.value).toBe(1)
        })
        it('await finally', async () => {
          const async = new Async(resolve => setTimeout(() => resolve(1)))
          expect(async.value).toBe(undefined)
          const then = async.finally(e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
        })
        it('reusable sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.finally(e => e + 1,true)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe(3)
        })
        it('reusable async', async () => {
          let i = 0
          const async = new Async(resolve => setTimeout(() => resolve(i++)))
          expect(async.value).toBe(undefined)
          const then = async.finally(e => e + 1,true)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          async.update()
          expect(async.value).toBe(0)
          expect(then.value).toBe(1)
          expect(await then).toBe(2)
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe(2)
          expect(await then).toBe(3)
        })
      })
      describe('async finally', () => {
        it('async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then = async.finally(async e => e + 1)
          expect(then.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then.value).toBe(1)
        })
        it('promise', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.finally(e => new Promise(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.finally(e => new Promise(resolve => resolve(e + 1)))
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
        it('Async', async () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.finally(e => new Async(resolve => setTimeout(() => resolve(e + 1))))
          const then2 = async.finally(e => new Async(resolve => resolve(e + 1)))
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await async).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(1)
          expect(await then1).toBe(1)
          expect(then1.value).toBe(1)
        })
      })
      describe('deep', () => {
        it('sync', () => {
          let i = 0
          const async = new Async(resolve => resolve(i++))
          expect(async.value).toBe(0)
          const then1 = async.finally(e => e + 1, true)
          const then2 = then1.finally(e => e + 1, true)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
          async.update()
          expect(async.value).toBe(1)
          expect(then1.value).toBe(2)
          expect(then2.value).toBe(3)
          async.update()
          expect(async.value).toBe(2)
          expect(then1.value).toBe(3)
          expect(then2.value).toBe(4)
        })
        it('async', async () => {
          let i = 0
          const async = new Async(async resolve => resolve(i++))
          const then1 = async.finally(async e => e + 1)
          const then2 = then1.finally(async e => e + 1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(undefined)
          expect(then2.value).toBe(undefined)
          expect(await then1).toBe(1)
          expect(async.value).toBe(0)
          expect(then1.value).toBe(1)
          expect(then2.value).toBe(2)
        })
        it('update', () => {
          let i = 0, j = 0
          const async = new Async(resolve => resolve(i++))
          const then = async.finally(e => `i:${e};j:${j++}`, true)
          expect(async.value).toBe(0)
          expect(then.value).toBe('i:0;j:0')
          async.update()
          expect(async.value).toBe(1)
          expect(then.value).toBe('i:1;j:1')
          then.update()
          expect(async.value).toBe(2)
          expect(then.value).toBe('i:2;j:2')
        })
      })
    })
  })
  describe('autorun', () => {
    describe('value', () => {
      it('sync', () => {
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
      it('async', async () => {
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
      it('function', () => {
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
      it('sync', () => {
        const async = new Async()
        const test = []
        autorun(() => test.push(async.error))
        expect(test.length).toBe(1)
        expect(test[0]).toBe(undefined)
        async.reject(1)
        expect(test.length).toBe(2)
        expect(test[1]).toBe(1)
      })
      it('async', async () => {
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
      const test = new Async<string>(resolve => resolve('1'))
      test.resolve('1')
    })
    test('reject', () => {
      const test = new Async<string, number>((resolve, reject) => reject(1))
      test.reject(1)
    })
  })
})
