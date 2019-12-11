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
