export class Food {
  constructor(id, name, imageUrl, selected, tags) {
    this.id = id
    this.name = name
    this.imageUrl = imageUrl
    this.selected = selected
    this.tags = tags
  }
}

export class Category {
  constructor(id, name, foods) {
    this.id = id
    this.name = name
    this.foods = foods || []
  }
}
