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

export interface BookData {
  chapters: Chapter[]
  lastUpdated: string
}
