const PREFIX = 'msms_'

function getKey(key: string): string {
  return PREFIX + key
}

function get<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(getKey(key))
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function set(key: string, value: unknown): void {
  localStorage.setItem(getKey(key), JSON.stringify(value))
}

function remove(key: string): void {
  localStorage.removeItem(getKey(key))
}

export interface MistakeItem {
  questionId: number
  questionContent: string
  mistakeCount: number
  consecutiveCorrect: number
  lastMistakeAt: string
  lastAnswerAt: string | null
  status: 'active' | 'mastered'
  masteredAt: string | null
  isFavorite: boolean
  note: string
}

export interface CheckinRecord {
  date: string
  questionCount: number
}

export interface MasteryRecord {
  knowledgePointId: number
  knowledgePointName: string
  status: 'learning' | 'mastered' | 'not_started'
  correctCount: number
  totalCount: number
  lastStudyAt: string | null
  masteredAt: string | null
}

export interface LearningStats {
  totalAnswered: number
  totalCorrect: number
  streakDays: number
  lastStudyDate: string | null
  masteredCount: number
}

export interface ReviewPlan {
  knowledgePointId: number
  knowledgePointName: string
  priority: number
  weakReason: string | null
  status: 'pending' | 'completed' | 'skipped'
  createdAt: string
}

export const localStore = {
  get,
  set,
  remove,

  getMistakes(): MistakeItem[] {
    return get<MistakeItem[]>('mistakes', [])
  },
  setMistakes(items: MistakeItem[]): void {
    set('mistakes', items)
  },
  addMistake(item: MistakeItem): void {
    const list = getMistakes()
    const idx = list.findIndex((m) => m.questionId === item.questionId)
    if (idx >= 0) {
      list[idx] = item
    } else {
      list.push(item)
    }
    setMistakes(list)
  },
  removeMistake(questionId: number): void {
    setMistakes(getMistakes().filter((m) => m.questionId !== questionId))
  },

  getCheckins(): CheckinRecord[] {
    return get<CheckinRecord[]>('checkins', [])
  },
  setCheckins(items: CheckinRecord[]): void {
    set('checkins', items)
  },
  addCheckin(date: string, count: number): void {
    const list = getCheckins()
    const idx = list.findIndex((c) => c.date === date)
    if (idx >= 0) {
      list[idx].questionCount += count
    } else {
      list.push({ date, questionCount: count })
    }
    setCheckins(list)
  },

  getMasteries(): MasteryRecord[] {
    return get<MasteryRecord[]>('masteries', [])
  },
  setMasteries(items: MasteryRecord[]): void {
    set('masteries', items)
  },
  updateMastery(kpId: number, update: Partial<MasteryRecord>): void {
    const list = getMasteries()
    const idx = list.findIndex((m) => m.knowledgePointId === kpId)
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...update }
    } else {
      list.push({ knowledgePointId: kpId, knowledgePointName: '', status: 'not_started', correctCount: 0, totalCount: 0, lastStudyAt: null, masteredAt: null, ...update })
    }
    setMasteries(list)
  },

  getStats(): LearningStats {
    return get<LearningStats>('stats', {
      totalAnswered: 0,
      totalCorrect: 0,
      streakDays: 0,
      lastStudyDate: null,
      masteredCount: 0,
    })
  },
  setStats(stats: LearningStats): void {
    set('stats', stats)
  },

  getReviewPlans(): ReviewPlan[] {
    return get<ReviewPlan[]>('review_plans', [])
  },
  setReviewPlans(items: ReviewPlan[]): void {
    set('review_plans', items)
  },

  getAllData(): Record<string, unknown> {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '')
        } catch {
          data[key] = localStorage.getItem(key)
        }
      }
    }
    return data
  },

  restoreAllData(data: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(PREFIX)) {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      }
    }
  },
}
