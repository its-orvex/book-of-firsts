export interface Photo {
  url: string
  caption?: string
}

export interface Chapter {
  id: string
  title: string
  date: string
  notes: string
  photos: Photo[]
}

export interface BookConfig {
  dedication: string
  backMessage: string
}

export interface BookData {
  chapters: Chapter[]
  config: BookConfig
  lastUpdated: string
}
