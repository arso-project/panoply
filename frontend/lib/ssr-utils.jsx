// let init = false
// let cache = {
//   promises: new Map(),
//   results: new Map()
// }
// function useSSR (asyncFn, defaultValue) {
//   console.log('USE', cache)
//   const promise = asyncFn()
//     .then(result => cache.results.set(asyncFn, result))
//   if (!init) {
//     init = true
//     // throw cache
//   }
//   cache.promises.set(asyncFn, promise)
//   if (cache.results.has(asyncFn)) return cache.results.get(asyncFn)
//   // else throw cache
//   return defaultValue
// }

// function useSSR (asyncFn, defaultValue) {
//   let result
//   const promise = asyncFn()
//     .then(res => (result = res))

//   while (typeof result === 'undefined') {}

//   return result
//   // return defaultValue
// }

// function useSSRTest () {
//   if (IS_SERVER) {
//     const result = useSSR(fetchData, 'SSR DEFAULT')
//     return result
//   } else return 'clientside'

//   async function fetchData () {
//     return 'SSR WORKS !!!11!!11'
//   }
// }

// async function awaitSSR () {
//   await Promise.all(data)
// }

// function resetSSR () {
//   data = new Map()
//   results = new Map()
// }

// function useReadableSSR (stream, opts) {
//   const { count, offset } = opts
//   const result = useSSR(fetchData, [[], 0])
//   return result
//   async function fetchData () {
//     return new Promise((resolve, reject) => {
//       const buf = []
//       stream.on('data', data => {
//         buf.push(data)
//         if (buf.length >= count + offset) {
//           stream.destroy()
//           resolve(buf)
//         }
//       })
//     })
//   }
// }
