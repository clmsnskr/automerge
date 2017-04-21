
// -------------------------------------------- //
//         Tesseract Integration Tests 
// -------------------------------------------- //

let Store = require('./tesseract').Store

let deep_equals = (a,b) => {
  if ((typeof a == 'object' && a != null) &&
      (typeof b == 'object' && b != null))
  {
    let ak = Object.keys(a).sort()
    let bk = Object.keys(b).sort()
    if (ak.length != bk.length) return false
    for (let i = 0; i < ak.length; i++) {
      if (ak[i] != bk[i]) return false
      if (deep_equals(a[ak[i]],b[bk[i]]) == false) return false
    }
    return true
  }
  else
  {
    return a === b
  }
}

function pp(o) {
  let keys = Object.keys(o).sort();
  let o2 = {}
  for (let i in keys) {
    o2[keys[i]] = o[keys[i]]
  }
  return o2;
}

let store1 = new Store("store1")
store1.root.foo = "foo"
store1.root.bar = store1.root.foo + "bar"
store1.root.dang = 12345
store1.root.obj = { hello: "world" }
store1.root.obj2 = store1.root.obj
delete store1.root["dang"]

let mark1 = {
  foo: 'foo',
  bar: 'foobar',
  obj: { hello: 'world' },
  obj2: { hello: 'world' }
}

console.log("Test - 01 - local set / nest / link")
console.assert(deep_equals(store1.root,mark1))

let store2 = new Store("store2")
store2.root["xxx"] = "yyy"
store2.sync(store1)
store2.root.obj3 = store2.root.obj
delete store2.root.obj

store2.sync(store1)

let mark2 = {
  foo: 'foo',
  bar: 'foobar',
  obj2: { hello: 'world' },
  obj3: { hello: 'world' },
  xxx: 'yyy'
}

console.log("Test - 02 - sync both ways")
console.assert(deep_equals(store1.root,store2.root))
console.assert(deep_equals(store1.root, mark2))

let store3 = new Store("store3")

store1.link(store2)

store1.root.linktest1 = "123"
store2.root.linktest2 = "abc"

console.log("Test - 03 - linked stores")
console.assert(deep_equals(store1.root,store2.root))
console.assert(store2.root.linktest1 == "123")
console.assert(store1.root.linktest2 == "abc")

console.log("Test - 04 - linked w two nodes who cant talk")
store3.link(store2)
store3.root.linktest3 = "zzz"
store1.root.linktest1 = "aaa"
console.assert(store3.root.linktest3 == "zzz")
console.assert(store2.root.linktest3 == "zzz")
console.assert(store1.root.linktest3 == "zzz")
console.assert(store3.root.linktest1 == "aaa")
console.assert(store2.root.linktest1 == "aaa")
console.assert(store1.root.linktest1 == "aaa")

console.log("Test - 05 - pause syncing")

store2.pause()
store3.root.linktest3 = "vvv"
store1.root.linktest1 = "bbb"
console.assert(store3.root.linktest3 == "vvv")
console.assert(store2.root.linktest3 == "zzz")
console.assert(store1.root.linktest3 == "zzz")
console.assert(store3.root.linktest1 == "aaa")
console.assert(store2.root.linktest1 == "aaa")
console.assert(store1.root.linktest1 == "bbb")

console.log("Test - 06 - unpause syncing")

store2.unpause()
console.assert(store3.root.linktest3 == "vvv")
console.assert(store2.root.linktest3 == "vvv")
console.assert(store1.root.linktest3 == "vvv")
console.assert(store3.root.linktest1 == "bbb")
console.assert(store2.root.linktest1 == "bbb")
console.assert(store1.root.linktest1 == "bbb")

console.log("Test - 07 - conflicts")

store2.pause()
store1.root.conflict_test = "111"
store2.root.conflict_test = "222"
store3.root.conflict_test = "333"
store2.unpause()

console.assert(store3.root.conflict_test == "333")
console.assert(store2.root.conflict_test == "333")
console.assert(store1.root.conflict_test == "333")

console.assert(deep_equals(store1.root._conflicts.conflict_test,{store1:'111',store2:'222'}))
console.assert(deep_equals(store2.root._conflicts.conflict_test,{store1:'111',store2:'222'}))
console.assert(deep_equals(store3.root._conflicts.conflict_test,{store1:'111',store2:'222'}))

store1.root.conflict_test = "new1"

console.assert(store3.root.conflict_test == "new1")
console.assert(store2.root.conflict_test == "new1")
console.assert(store1.root.conflict_test == "new1")

console.log("Test - 08 - conflict delete")

store2.pause()
store1.root.conflict_test = "xxx"
delete store3.root.conflict_test
store2.unpause()

console.assert(store1.root.conflict_test === undefined)
console.assert(store2.root.conflict_test === undefined)
console.assert(store3.root.conflict_test === undefined)

console.assert(deep_equals(store1.root._conflicts.conflict_test,{store1:'xxx'}))
console.assert(deep_equals(store2.root._conflicts.conflict_test,{store1:'xxx'}))
console.assert(deep_equals(store3.root._conflicts.conflict_test,{store1:'xxx'}))

store2.pause()
delete store1.root.conflict_test
store3.root.conflict_test = "yyy"
store2.unpause()

console.assert(store1.root.conflict_test === "yyy")
console.assert(store2.root.conflict_test === "yyy")
console.assert(store3.root.conflict_test === "yyy")

console.assert(deep_equals(store1.root._conflicts.conflict_test,{store1:undefined}))
console.assert(deep_equals(store2.root._conflicts.conflict_test,{store1:undefined}))
console.assert(deep_equals(store3.root._conflicts.conflict_test,{store1:undefined}))

console.log("Test - 09 - many conflicts")

store2.pause()
store1.root.conflict_test = "s1a"
store1.root.conflict_test = "s1b"
store1.root.conflict_test = "s1c"
store1.root.conflict_test = "s1d"
store2.root.conflict_test = "s2a"
store2.root.conflict_test = "s2b"
store3.root.conflict_test = "s3a"
store3.root.conflict_test = "s3b"
store3.root.conflict_test = "s3c"
store2.unpause()

console.assert(store1.root.conflict_test === "s3c")
console.assert(store2.root.conflict_test === "s3c")
console.assert(store3.root.conflict_test === "s3c")

console.assert(deep_equals(store1.root._conflicts.conflict_test,{ store1: 's1d', store2: 's2b'}))
console.assert(deep_equals(store2.root._conflicts.conflict_test,{ store1: 's1d', store2: 's2b'}))
console.assert(deep_equals(store3.root._conflicts.conflict_test,{ store1: 's1d', store2: 's2b'}))

console.log("Test - 10 - link conflicts")

store2.pause()
store1.root.conflict_test = "111"
store2.root.conflict_test = "222"
store3.root.conflict_test = store3.root.obj2
store2.unpause()

store2.root.x = 1;

console.assert(deep_equals(store1.root.conflict_test,{ hello: "world" }))
console.assert(deep_equals(store3.root.conflict_test,{ hello: "world" }))
console.assert(deep_equals(store1.root._conflicts.conflict_test,{ store1: '111', store2: '222'}))

store2.pause()
store1.root.conflict_test = store3.root.obj2
store3.root.conflict_test = "111"
store2.unpause()

console.assert(store1.root.conflict_test === "111")
console.assert(store3.root.conflict_test === "111")
console.assert(deep_equals(store1.root._conflicts.conflict_test,{ store1: {hello: 'world' }}))

console.log("All tests passed")
