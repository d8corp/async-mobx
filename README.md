# async-mobx
[![NPM](https://img.shields.io/npm/v/async-mobx.svg)](https://github.com/d8corp/async-mobx/blob/master/CHANGELOG.md)
[![downloads](https://img.shields.io/npm/dm/async-mobx.svg)](https://www.npmjs.com/package/async-mobx)
[![license](https://img.shields.io/npm/l/async-mobx)](https://github.com/d8corp/async-mobx/blob/master/LICENSE)  
Getting async data for [Mobx](https://mobx.js.org/README.html) 3 and more.
### Installation
npm
```bash
npm i async-mobx
```
yarn
```bash
yarn add async-mobx
```
### Using
`Async` is a `Promise` like constructor
```javascript
import Async from 'async-mobx'

const promise = new Async((resolve, reject) => {
  fetch('/test').then(resolve, reject)
})
```
### then, catch, finally
`then`, `catch` and `finally` always return instance of `Async`
```javascript
const test = new Async().then() instanceof Async
// test === true 
```
Use `then`, `catch` and `finally` like for `Promise`
```javascript
const promise = new Async(resolve => resolve(1))
promise
  .finally(value => console.log('finally', value))
  .then(value => console.log('then', value))
  .catch(value => console.log('catch', value))
```
But we have one specific think for mobx, if you return a function to `resolve` or `reject` then the function will be called when you need to get the result
```javascript
(async () => {
  let test = true
  const promise = new Async(resolve => resolve(() => test = false))
  // test still equals true
  await promise
  // test is false
})()
```
The same happens if you return a function in `then`, `catch` or `finally`
```javascript
(async () => {
  let test = true
  const promise = new Async(resolve => resolve()).then(() => () => test = false)
  // test still equals true
  await promise
  // test is false
})()
```
You may override the result at function to fix it
```javascript
(async () => {
  function test () {}
  const promise = new Async(resolve => resolve(() => test))
  const result = await promise
  return result === test // true
})()
```
### loading
You may check status of `Async` with `loading`, it's `true` when data is loading
```javascript
(async () => {
  const promise = new Async(resolve => setTimeout(resolve))
  // promise.loading === true
  await promise
  // promise.loading === false
})()
```
### loaded
You may check status of `Async` with `loaded`, it's `true` when data was loaded at least one time
```javascript
(async () => {
  const promise = new Async(resolve => setTimeout(resolve))
  // promise.loaded === false
  await promise
  // promise.loaded === true
})()
```
### value
You may get result without `await` synchronously with `value`
```javascript
const promise = new Async(resolve => resolve(1))
// promise.value === 1
```
But `value` returns result at the moment
```javascript
(async () => {
  const promise = new Async(resolve => setTimeout(() => resolve(1)))
  // promise.value === undefined
  await promise
  // promise.value === 1
})()
```
### error
You may handle error without `await` synchronously with `error` like `value` with `resolve`
```javascript
const promise = new Async((resolve, reject) => reject(1))
// promise.error === 1
```
### default
You may provide default `value` for `Async`
```javascript
(async () => {
  const promise = new Async({
    request: resolve => setTimeout(() => resolve(2)),
    default: 1
  })
  // promise.value === 1
  await promise
  // promise.value === 2
})()
```
### response
`response` is the same `value` but without default value
```javascript
(async () => {
  const promise = new Async({
    request: resolve => setTimeout(() => resolve(2)),
    default: 1
  })
  // promise.value === 1
  // promise.response === undefined
  await promise
  // promise.value === 2
  // promise.response === 2
})()
```
### update
Unlike `Promise`, you may reuse `Async` with `update` method
```javascript
let i = 0
const promise = new Async(resolve => resolve(i++))
// i === 1
promise.update()
// i === 2
```
### resolve
You may use `resolve` to say async that loading is finished successfully
```javascript
const promise = new Async()
promise.resolve(1)
// promise.value === 1
```
### reject
You may use `reject` to say async that loading is finished with error
```javascript
const promise = new Async()
promise.reject(1)
// promise.error === 1
```
### on, once, off
You may add a listener to react on events
```javascript
const promise = new Async()
let test = false
promise.on('resolve', value => test = value)
// test === false
promise.resolve(true)
// test === true
promise.resolve(false)
// test === false
```
You may add a listener which reacts only once with `once`
```javascript
const promise = new Async()
let test = false
promise.once('resolve', value => test = value)
// test === false
promise.resolve(true)
// test === true
promise.resolve(false)
// test === true
```
You may turn off a listener
```javascript
const promise = new Async()
let test = false
const listener = value => test = value
promise.on('resolve', listener)
// test === false
promise.resolve(true)
// test === true
promise.off('resolve', listener)
promise.resolve(false)
// test === true
```
## Issues
If you find a bug, please file an issue on [GitHub](https://github.com/d8corp/async-mobx/issues)  
[![issues](https://img.shields.io/github/issues-raw/d8corp/async-mobx)](https://github.com/d8corp/async-mobx/issues)  
> ---
[![stars](https://img.shields.io/github/stars/d8corp/async-mobx?style=social)](https://github.com/d8corp/async-mobx/stargazers)
[![watchers](https://img.shields.io/github/watchers/d8corp/async-mobx?style=social)](https://github.com/d8corp/async-mobx/watchers)

