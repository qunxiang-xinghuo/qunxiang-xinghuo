import { describe, it, expect, vi, beforeEach } from 'vitest'
import { weaveStory, analyzeStoryStructure, Spark } from '@/lib/ai/story-weaver'

describe('story-weaver', () => {
  const mockSparks: Spark[] = [
    {
      content: '先推肾上腺素，准备除颤仪！',
      identity: '急诊科医生',
      timestamp: new Date(),
      emotionTags: ['紧张', '果断'],
    },
    {
      content: '医生，病人手指动了一下！',
      identity: '实习护士',
      timestamp: new Date(),
      emotionTags: ['惊喜', '紧张'],
    },
    {
      content: '血压回升了，60/40...还在往上升',
      identity: '麻醉师',
      timestamp: new Date(),
      emotionTags: ['如释重负'],
    },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('weaveStory', () => {
    it('should return valid StoryWeaveResponse structure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                story: '凌晨2点的急诊室，灯光惨白。医生推开门......',
                title: '凌晨2点的急诊室',
                summary: '一场生死抢救，三个不同身份的人在急诊室的经历',
                characterProfiles: [
                  { identity: '急诊科医生', traits: ['果断', '专业'], role: '主刀' },
                  { identity: '实习护士', traits: ['细心', '敏感'], role: '协助' },
                  { identity: '麻醉师', traits: ['沉稳', '精准'], role: '监控' },
                ],
                estimatedReadingTime: 3,
              }),
            },
          }],
        }),
      } as Response))

      const result = await weaveStory({
        sparks: mockSparks,
        format: 'script',
        tone: '紧张真实',
        length: 'medium',
      })

      expect(result).toHaveProperty('story')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('summary')
      expect(result).toHaveProperty('characterProfiles')
      expect(result).toHaveProperty('estimatedReadingTime')

      expect(typeof result.story).toBe('string')
      expect(result.story.length).toBeGreaterThan(0)
      expect(typeof result.title).toBe('string')
      expect(Array.isArray(result.characterProfiles)).toBe(true)
      expect(result.characterProfiles.length).toBe(3)
    })

    it('should fallback when API fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await weaveStory({
        sparks: mockSparks,
        format: 'narrative',
      })

      expect(result.story).toBeTruthy()
      expect(result.title).toBeTruthy()
      expect(Array.isArray(result.characterProfiles)).toBe(true)
    })

    it('should fallback when API returns non-JSON', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: '这不是JSON格式',
            },
          }],
        }),
      } as Response))

      const result = await weaveStory({
        sparks: mockSparks,
        format: 'dialogue',
      })

      expect(result.story).toBeTruthy()
      expect(result.title).toBeTruthy()
    })
  })

  describe('analyzeStoryStructure', () => {
    it('should return story structure analysis', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{
            message: {
              content: JSON.stringify({
                potentialPlotPoints: ['抢救开始', '病人手指微动', '血压回升'],
                characterArcs: ['医生从紧张到冷静', '护士从慌乱到坚定'],
                suggestedFormat: 'script',
              }),
            },
          }],
        }),
      } as Response))

      const result = await analyzeStoryStructure(mockSparks)

      expect(result).toHaveProperty('potentialPlotPoints')
      expect(result).toHaveProperty('characterArcs')
      expect(result).toHaveProperty('suggestedFormat')

      expect(Array.isArray(result.potentialPlotPoints)).toBe(true)
      expect(Array.isArray(result.characterArcs)).toBe(true)
      expect(typeof result.suggestedFormat).toBe('string')
    })

    it('should fallback when API fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('API error')))

      const result = await analyzeStoryStructure(mockSparks)

      expect(Array.isArray(result.potentialPlotPoints)).toBe(true)
      expect(Array.isArray(result.characterArcs)).toBe(true)
    })
  })
})
