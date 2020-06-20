/**
 * A map with extra methods.
 * @extends {Map}
 */

class ExtendedMap extends Map {
  /**
   * Creates a new ExtendedMap.
   * @param {Iterable<*>} iterable - Any iterable that can be turned into a key/value pair.
   * @example
   * new ExtendedMap([["Key1", "Value1"], ["Key2", "Value2"]])
   */
  constructor(iterable) {
    super(iterable)
  }

  /**
   * Returns the keys of this ExtendedMap as an array.
   * @returns {!Array} - The keys.
   */
  keyArray() {
    return [...this.keys()]
  }

  /**
   * Returns the values of this ExtendedMap as an array.
   * @returns {!Array} - The values.
   */
  valueArray() {
    return [...this.values()]
  }

  /**
   * Returns the value of the first item in the ExtendedMap to pass the function.
   * @param {Function} fn - The compare function should return a boolean. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {?*} - The value, or null if none found.
   * @example
   * map.find(value => value.prop === 10)
   */
  find(fn) {
    for (let [k, v] of this) {
      if (fn(v, k, this)) return v
    }
    return null
  }

  /**
   * Returns the key of the first item in the ExtendedMap to pass the function.
   * @param {Function} fn - The compare function should return a boolean. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {?*} - The value, or null if none found.
   * @example
   * map.findKey(value => value.prop === 10)
   */
  findKey(fn) {
    for (let [k, v] of this) {
      if (fn(v, k, this)) return k
    }
    return null
  }

  /**
   * Identical to [Array.map()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map).
   * @param {Function} fn - The function to map by. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {!Array} - The mapped values.
   * @example
   * extmap.map(t => t.username + "#" + t.tag)
   */
  map(fn) {
    let returnArr = new Array(this.size)
    let i = 0
    for (let [k, v] of this) {
      returnArr[i++] = fn(v, k, this)
    }
    return returnArr
  }

  /**
   * Returns entries that the provided function returns true for. Non-destructive.
   * @param {Function} fn - The compare function should return a boolean. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {!ExtendedMap} - The items that passed the provided function.
   * @example
   * // Returns any values where the bot property is false.
   * map.filter(t => !t.bot)
   */
  filter(fn) {
    let returnMap = new ExtendedMap()
    for (let [k, v] of this) {
      if (fn(v, k, this)) returnMap.set(k, v)
    }
    return returnMap
  }

  /**
   * Returns the ExtendedMap sorted by the provided function. Non-destructive.
   * @param {Function} fn - The function to sort by. Passes current value, next value as parameters. Should return a number.
   * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort|sort}
   * @returns {!ExtendedMap} - The sorted ExtendedMap.
   * @example
   * // Returns an ExtendedMap where the first value has the lowest id and the last has the highest.
   * map.sort((a, b) => a.id - b.id)
   */
  sort(fn) {
    let returnMap = new ExtendedMap()
    let keys = this.keyArray()
    let values = this.valueArray()
    let sortedValues = this.valueArray().sort((t1, t2) => fn(t1, t2))
    for (let v of sortedValues) {
      let index = values.findIndex(t => {
        if (typeof t === "object" && t !== null) {
          if (typeof v !== "object" || v === null) return false
          let keys = Object.keys(t)
          if (keys.length == 0 && Object.keys(v) == 0) return true
          return t[keys[0]] == v[keys[0]]
        } else {
          return t === v
        }
      })
      if (index === -1) continue
      returnMap.set(keys[index], v)
    }
    return returnMap
  }

  /**
   * Concatenates multiple ExtendedMaps into one new ExtendedMap.
   * @param  {...ExtendedMap} maps - The ExtendedMaps to concatenate.
   * @returns {!ExtendedMap} - The concatenated ExtendedMaps. 
   * @example
   * map.concat(extmap2, extmap3, extmap4, ...)
   */
  concat(...maps) {
    let returnMap = this.clone()
    for (let map of maps) {
      for (let [k, v] of map) returnMap.set(k, v)
    }
    return returnMap
  }

  /**
   * Separates the ExtendedMap into 2 new ExtendedMaps where the first one has values that passed the provided function and the second one has values that didn't.
   * @param {Function} fn - The function to partition by. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {!ExtendedMap[]} - The 2 ExtendedMaps.
   * @example
   * let [notBots, bots] = map.partition(member => !member.bot)
   */
  partition(fn) {
    let returnMaps = [new ExtendedMap(), new ExtendedMap()]
    for (let [k, v] of this) {
      if (fn(v, k, this)) returnMaps[0].set(k, v)
      else returnMaps[1].set(k, v)
    }
    return returnMaps
  }

  /**
   * Returns true if every value in the ExtendedMap passes the function.
   * @param {Function} fn - The compare function should return a boolean. Passes value and the ExtendedMap the function is being executed on as parameters.
   * @returns {!boolean} - Whether the function returned true at all times.
   * @example
   * let containsNoBots = map.every(member => !member.bot) 
   */
  every(fn) {
    let values = this.valueArray()
    for (let v of values) {
      if (!fn(v, this)) return false
    }
    return true
  }

  /**
   * Returns true if at least one value in the ExtendedMap passes the function.
   * @param {Function} fn - The compare function should return a boolean. Passes value and the ExtendedMap the function is being executed on as parameters.
   * @returns {!boolean} - Whether the function returned true at least once.
   * @example
   * let containsAUser = map.some(member => !member.bot) 
   */
  some(fn) {
    let values = this.valueArray()
    for (let v of values) {
      if (fn(v, this)) return true
    }
    return false
  }

  /**
   * Removes items in place from the ExtendedMap that pass the function.
   * @param {Function} fn - The compare function should return a boolean. Passes value, key, and the ExtendedMap the function is being executed on as parameters.
   * @returns {!ExtendedMap} - An ExtendedMap containing all removed items.
   * @example
   * // Removes all the items it returns.
   * let futureDates = map.sweep(timestamp => timestamp > Date.now())
   */
  sweep(fn) {
    let removedItems = new ExtendedMap()
    for (let [k, v] of this) {
      if (fn(v, k, this)) {
        removedItems.set(k, v)
        this.delete(k)
      }
    }
    return removedItems
  }

  /**
   * Identical to [Map.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/forEach), but returns the ExtendedMap for chaining.
   * @param {Function} fn - The function to run on each entry.
   * @returns {ExtendedMap}
   * @example
   * map.forEach(member => console.log(member.uid)).filter(member => member.id < 1234567890).forEach(member => console.log(member.uid)) 
   */
  forEach(fn) {
    super.forEach(fn)
    return this
  }

  /**
   * Reduces the ExtendedMap to a single value.
   * @param {Function} fn - The function to reduce by. 
   * @param {*} [initial] - The initial value, if reducing objects this must be provided or you'll get unexpected results.
   * @returns {*} - The value.
   */
  reduce(fn, initial) {
    return this.valueArray().reduce(fn, initial)
  }

  /**
   * Returns a clone of the ExtendedMap.
   * @returns {ExtendedMap} - The clone.
   */
  clone() {
    return new ExtendedMap(this);
  }
}

module.exports = ExtendedMap