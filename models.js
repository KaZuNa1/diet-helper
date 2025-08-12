export class Food {
  constructor(id, name, imageUrl, selected, tags, notes = '', nutrition = null, specificData = '') {
    this.id = id
    this.name = name
    this.imageUrl = imageUrl
    this.selected = selected
    this.tags = tags
    this.notes = notes
    this.nutrition = nutrition || {
      protein: null,
      fat: null,
      carbs: null,
      fiber: null,
      sugar: null,
      sodium: null,
    }
    this.specificData = specificData
  }
}

export class Category {
  constructor(id, name, foods, subgroups) {
    this.id = id
    this.name = name
    this.foods = foods || []
    this.subgroups = subgroups || []
  }
}
export class Subgroup {
  constructor(id, name, foods) {
    this.id = id
    this.name = name
    this.foods = foods || []
  }
}
