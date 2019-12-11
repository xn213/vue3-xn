> [xn-vue3.js](###xn-vue3.js) | [codepen演示](https://codepen.io/xn213/pen/QWWogXX)

## github/vuejs/vue-next [源码](https://github.com/vuejs/vue-next)

> **Status: Pre-Alpha.**

### 下载源码: (生成packages\vue\dist\vue.global.js) (vue3.js)
```sh
git clone https://github.com/vuejs/vue-next.git
cd vue-next # 并安装依赖
yarn dev # create packages\vue\dist\vue.global.js
```

### Test

```html
<!-- # new packages\vue\index.html -->
  <div id="app"></div>
  <!-- 引入 vue.global.js -->
  <script src="./dist/vue.global.js"></script>
  <script>
    // reactive 响应式
    const { createApp, reactive, computed, effect } = Vue
    // 组件定义
    const XnComponent = {
      template: `<button @click="increment">Count is {{ state.count }}, double is {{ state.double }}</button>`,
      // 数据处理
      setup(){
        // 定义响应数据, // data(){return { count: 0 }}
        const state = reactive({
          count: 0,
          double: computed(() => state.count * 2)
        })
        // 定义方法
        function increment(){
          state.count++
        }
        effect(() => {
          // 副作用
          console.log('数字修改了', state.count)
        })
        // 返回依赖
        return { state, increment, }
      },
    }
    // 创建app 挂载组件 XnComponent 到 #app
    createApp().mount(XnComponent, '#app')
  </script>
```

## Vue3 响应式原理 Proxy

### 对比 Vue2.x 使用 Object.defineProperty()

```js
let input = document.querySelector('#input')
let span = document.querySelector('#span')

let obj = {}
// 数据劫持
Object.defineProperty(obj, 'text', {
  configurable: true,
  enumerable: true,
  get(){
    console.log('获取值: ')
  },
  set(newVal){
    console.log('更新值: ', newVal)
    input.value = newVal
    span.innerHTML = newVal
  }
})
// 输入监听
input.addEventListener('keyup', e => {
  obj.text = e.target.value
})
```

### test Proxy: [MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Proxy)

1. ##### 监听(代理)数组 报错(Reflect处理)/ 二次触发 和 多次触发 get/set 问题
2. ##### 代理对象 对象嵌套问题, 不会触发深层次的 set 问题

```js
// new Proxy(obj, handler)

// Object 类型
// let obj = {name: 'xn213'}
let obj = {name: 'xn213', location: {city: '北京'}}

// Array 类型
// let obj = [1, 2, 3]
let xn = new Proxy(obj, {
  get(target, key){
    console.log('获取值:', key)
    // return target[key]
    return Reflect.get(target, key, )
  },
  set(target, key, val){
    console.log('修改值:', key, val)
    // target[key] = val
    // return true // 这里return true 可以简单解决数组报错的问题(理解)
    return Reflect.set(target, key, val)
  }
})
// 对象
// xn.name = 'xn2113'
// console.log(xn.name) // xn2113

// 1. 对象嵌套 不触发

//    修改 location 的 city 不会触发city set(){}
// // 获取值: location
// // 获取值: location
// // 杭州
xn.location.city = '杭州'
console.log(o.location.city) // 杭州

// 2. 数组多次触发

// xn.push(4)
/** push从后面添加, 会触发两次
 * 获取值 push
 * 获取值 length
 * 修改值 3 4
 * 修改值 length 4
 */
 
// xn.unshift(4)
/** unshift 从前面添加, 就会触发不止两次
 * 获取值 unshift
 * 获取值 length
 * 获取值 2
 * 修改值 3 3
 * 获取值 1
 * 修改值 2 2
 * 获取值 0
 * 修改值 1 1
 * 修改值 0 4
 * 修改值 length 4
 */
```

### 手写 reactive()

```js
// 定义 reactive
function reactive(target){
  // 查询缓存
  ...
  // 响应式
  observed = new Proxy(target, baseHandler)
  // 设置缓存
  ...
  // 返回(观测到的)响应后的对象
  return observed
}
```

```js
// 设置两个缓存 旧查新 新查旧
let toProxy = new WeakMap() // 根据原始数据查询响应后的数据
let toRaw = new WeakMap() // 根据响应后的数据查询原始数据
```

```js
// 定义 handler对象 > baseHandler
const baseHandler = {
  get(target, key){
    // 收集依赖 后返回数据
    track(target, key)
  },
  set(target, key, val){
    // 触发更新 后返回数据
    trigger(target, key, info)
  }
}
```
<small><center>↓</center></small>

```js
// 收集依赖
function track(target, key){}
```
<small><center>↓</center></small>

```js
// 触发更新
function trigger(target, key, info){}
```
<small><center>↓</center></small>

```js
function effect(fn, options={}){}
```
<small><center>↓</center></small>

```js
function createReactiveEffect(fn, options){}
```
<small><center>↓</center></small>

```js
function computed(fn){}
```

## simple little demo 完整: xn-vue3.js

### demo.html
```html
  <div id="app"></div>
  <button id="btn">点我, 又长大了...</button>
  <script src="./xn-vue3.js"></script>
  <script>
    const root = document.querySelector('#app')
    const btn = document.querySelector('#btn')

    const obj = reactive({
      name: '本猿',
      age: '213'
    })
    
    let double = computed(() => obj.age * 2)
    
    effect(() => {
      root.innerHTML = `
        <h1>${obj.name}今年${obj.age}岁了, 乘以2是${double.value}</h1>
      `
    })
    
    btn.addEventListener('click', () => {
      obj.age++
    }, false)
  </script>
```

### xn-vue3.js
```js
// 设置两个缓存
let toProxy = new WeakMap() // 根据原始数据查询响应后的数据
let toRaw = new WeakMap() // 根据响应后的数据查询原始数据

const isObject = val => val !== null && typeof val === 'object'

// handler 对象，其属性是当执行一个操作时定义代理的行为的函数
const baseHandler = {
  get(target, key){
    const res = Reflect.get(target, key)
    // 收集依赖
    track(target, key)
    // 递归查找
    // 这里暂作简单判断, 可以严谨用isObject 工具
    // return typeof res == 'object' ? reactive(res) : res
    return isObject(res) ? reactive(res) : res
  },
  set(target, key, val){
    const info = {oldValue: target[key], newValue: val}
    const res = Reflect.set(target, key, val)
    // 触发更新
    trigger(target, key, info)
    return res
  }
}

function reactive(target){
  // 查询缓存
  let observed = toProxy.get(target)
  if(observed){
    return observed
  }
  if(toRaw.get(target)){
    return target
  }
  // 响应式
  observed = new Proxy(target, baseHandler)
  // 设置缓存
  toProxy.set(target, observed)
  toRaw.set(observed, target)
  return observed
}

let effectStack = []
let targetMap = new WeakMap() // 存储 effect

// {
//   target: {
//     age: [] (set),
//     name: [effect]
//   }
// }

function trigger(target, key, info){
  // 触发更新
  const depsMap = targetMap.get(target)

  if(depsMap === undefined){
    return
  }
  const effects = new Set()
  const computedRunners = new Set()
  if(key){
    let deps = depsMap.get(key)
    deps.forEach(effect => {
      if(effect.computed){
        computedRunners.add(effect)
      }else{
        effects.add(effect)
      }
    })
  }
  // const run = effect => effect()
  effects.forEach(effect => effect())
  computedRunners.forEach(effect => effect())
}

function track(target, key){
  let effect = effectStack[effectStack.length - 1]
  if(effect){
    let depsMap = targetMap.get(target)
    if(depsMap === undefined){
      depsMap = new Map()
      targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if(dep === undefined){
      dep = new Set()
      depsMap.set(key, dep)
    }
    if(!dep.has(effect)){
      dep.add(effect)
      effect.deps.push(dep)
    }
  }
}

function effect(fn, options={}){
  let e = createReactiveEffect(fn, options)
  // 没有考虑 computed
  e()
  return e
}

// 高阶函数
function createReactiveEffect(fn, options){
  const effect = function effect(...args){
    return run(effect, fn, args)
  }
  effect.deps = []
  effect.computed = options.computed
  effect.lazy = options.lazy
  return effect
}

function run(effect, fn, args){
  if(effectStack.indexOf(effect) === -1){
    try {
      effectStack.push(effect)
      return fn(...args)
    }
    finally {
      effectStack.pop() // 清空
    }
  }
}

function computed(fn){
  // 首次不运行computed
  const runner = effect(fn, {computed: true, lazy: true})
  return {
    effect: runner,
    get value(){
      return runner()
    }
  }
}
```

## 路漫漫兮...
>>> 路漫漫兮...