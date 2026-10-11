import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ScrollWorldBlock } from '@/blocks/ScrollWorld/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  faq: FAQBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  scrollWorld: ScrollWorldBlock,
}

// Blocks that render edge-to-edge without the vertical rhythm wrapper.
const fullBleed = new Set(['scrollWorld'])

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  /** True when the page has no hero, so the first block owns the page <h1>. */
  firstBlockIsPrimary?: boolean
}> = (props) => {
  const { blocks, firstBlockIsPrimary } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            // Each block receives its own data shape; the map can't express that per key.
            const Block = blockComponents[blockType] as React.FC<Record<string, unknown>>

            if (Block) {
              return (
                <div className={fullBleed.has(blockType) ? undefined : 'my-16'} key={index}>
                  <Block
                    {...block}
                    disableInnerContainer
                    primary={firstBlockIsPrimary && index === 0}
                  />
                </div>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
