import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp, fadeIn, scaleIn, staggerContainer, viewportOnce } from '@/lib/animations'
import { fetchContent } from '@/api/content'
import { resolveImageUrl } from '@/api/client'
import Skeleton from '@/components/shared/Skeleton'
import './ResearchSection.css'

export default function ResearchSection() {
  const [content, setContent] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContent('research').then(setContent).catch(console.error).finally(() => setLoading(false))
  }, [])

  const researchStats = [
    {
      value: loading ? null : (content.stat_citations_value ?? '14+'),
      label: loading ? null : (content.stat_citations_label ?? 'Citations'),
    },
    {
      value: loading ? null : (content.stat_pubs_value ?? '04'),
      label: loading ? null : (content.stat_pubs_label ?? 'Pubs'),
    },
  ]

  return (
    <section className="relative" id="research" aria-labelledby="research-heading">
      <div className="absolute -inset-10 bg-primary/10 blur-[150px] rounded-full -z-10 opacity-30" />

      <motion.div
        className="research-card"
        variants={scaleIn}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            className="space-y-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.p
              variants={fadeUp}
              className="font-bold text-xs uppercase tracking-[0.6em] text-primary/60"
            >
              03 / Research
            </motion.p>
            <motion.h2
              id="research-heading"
              variants={fadeUp}
              className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter"
            >
              {loading ? <Skeleton className="w-24 h-5" /> : (content.title_line1 ?? 'AI Researcher')} <br />
              {loading ? <Skeleton className="w-24 h-5" /> : (content.title_line2 ?? '@ AINet')}
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className="text-on-surface-variant text-xl leading-relaxed font-light"
            >
              {loading ? <Skeleton className="w-24 h-5" /> : (content.body ?? 'Investigating the efficiency of Transformer-based models in resource-constrained environments. Contributing to open-source frameworks for neural network pruning and quantization.')}
            </motion.p>

            <motion.div variants={fadeUp} className="flex gap-12">
              {researchStats.map((stat, i) => (
                <div key={i} className="flex gap-12 items-center">
                  {i > 0 && (
                    <div className="w-[1px] h-14 bg-white/10" />
                  )}
                  <motion.div
                    className="flex flex-col"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <span className="text-primary text-4xl font-extrabold tracking-tight">
                      {stat.value ?? <Skeleton className="w-24 h-5" />}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-on-surface-variant mt-1">
                      {stat.label ?? <Skeleton className="w-24 h-5" />}
                    </span>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="research-image-wrapper group"
            variants={fadeIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            whileHover={{ y: -4, transition: { duration: 0.4 } }}
          >
            <img
              src={content.image_url
                ? resolveImageUrl(content.image_url)
                : 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1t2vwe_ExDeathDRMChULSiv7l2yccCWvcV1gVuKLP3w7ednBTMBOS0MNmR_mttaEMQrzVwmwq5ru2B0epV5rBuqNzouCOv_rfsnzqk5GflgcBEkQqu7-UnvJO8o27faQQ2lkJ5JSWp0jthm925-ULoGkTuckUGkhUL9ewkgI2gJErqgZCtbPxdozoiOx37LI1AGo8tuwDorRajqbme34y5VO1e3i1hHTKB0qfkuXNXj70o_nki_IkfLsdbLGGt0m4ICOkTs-Iw'}
              alt="Neural Topology"
              loading="lazy"
              className="research-image"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-background/80 via-transparent to-transparent" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
