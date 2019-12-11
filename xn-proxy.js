// reactive 实现

// function reactive(target){
//   let baseHander = { get, set }
//   return new Proxy(target, baseHander)
// }

// let obj = {name: 'xn213'} // object
let obj = { name: 'xn213', location: { city: '北京' } } // object

// let obj = [1, 2, 3] // array
let o = new Proxy(obj, {
  get(target, key) {
    console.log('获取值: ', key)
    // return target[key]
    return Reflect.get(target, key)
  },
  set(target, key, val) {
    console.log('修改值: ', key, val)
    return Reflect.set(target, key, val)
  }
})

// 对象
// o.name = 'xn2113'
// console.log(o.name)

// 1. 对象嵌套
//    修改 location 的 city 不会触发city set
o.location.city = '杭州'
console.log(o.location.city) // beijing

// 2. 数组多次触发

// 数组 会多次触发
// o.push(4)
/** push从后面添加, 会触发两次
 * 获取值 push
 * 获取值 length
 * 修改值 3 4
 * 修改值 length 4
 */
// o.unshift(4)
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
