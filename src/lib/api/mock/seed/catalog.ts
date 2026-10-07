/**
 * Seed filament catalog.
 * HEX values are approximate display colors based on publicly listed swatches.
 * They are NOT measured physical truths. `hexVerified` marks the ones the
 * (mock) community has re-measured from real prints.
 */
import type { Filament, Finish, Manufacturer, Material, ProductLine, Transparency } from '@/types'

export const manufacturers: Manufacturer[] = [
  { id: 'bambu', name: 'Bambu Lab', website: 'https://bambulab.com' },
]

export const productLines: ProductLine[] = [
  { id: 'bambu-pla-basic', manufacturerId: 'bambu', name: 'PLA Basic', material: 'PLA', finish: 'basic' },
  { id: 'bambu-pla-matte', manufacturerId: 'bambu', name: 'PLA Matte', material: 'PLA', finish: 'matte' },
  { id: 'bambu-pla-silk', manufacturerId: 'bambu', name: 'PLA Silk+', material: 'PLA', finish: 'silk' },
  { id: 'bambu-pla-translucent', manufacturerId: 'bambu', name: 'PLA Translucent', material: 'PLA', finish: 'translucent' },
  { id: 'bambu-petg-hf', manufacturerId: 'bambu', name: 'PETG HF', material: 'PETG', finish: 'basic' },
]

type Row = [colorName: string, hex: string, code?: string, opts?: { finish?: Finish; transparency?: Transparency; verified?: boolean; notes?: string }]

const lines: Record<string, Row[]> = {
  'bambu-pla-basic': [
    ['Jade White', '#FFFFFF', '10100', { verified: true, notes: 'Bright, slightly cool white. The go-to base for pastels.' }],
    ['Black', '#000000', '10101', { verified: true }],
    ['Cobalt Blue', '#0056B8', '10601', { verified: true, notes: 'Very strong tint. A little goes a long way.' }],
    ['Red', '#C12E1F', '10200', { verified: true }],
    ['Yellow', '#F4EE2A', '10400', { verified: true }],
    ['Orange', '#FF6A13', '10300'],
    ['Bambu Green', '#00AE42', '10501', { verified: true }],
    ['Magenta', '#EC008C', '10202', { verified: true }],
    ['Cyan', '#0086D6', '10603', { verified: true }],
    ['Purple', '#5E43B7', '10700', { verified: true }],
    ['Gray', '#8E9089', '10103'],
    ['Light Gray', '#D1D3D5', '10104'],
    ['Silver', '#A6A9AA', '10102', { finish: 'metallic' }],
    ['Brown', '#9D432C', '10800'],
    ['Beige', '#F7E6DE', '10201'],
    ['Pink', '#F55A74', '10203'],
    ['Gold', '#E4BD68', '10401', { finish: 'metallic' }],
    ['Mistletoe Green', '#3F8E43', '10502'],
    ['Turquoise', '#00B1B7', '10605'],
    ['Indigo Purple', '#482960', '10701'],
    ['Maroon Red', '#9D2235', '10205'],
    ['Blue Grey', '#5B6579', '10602'],
    ['Sunflower Yellow', '#FEC600', '10402'],
    ['Cocoa Brown', '#6F5034', '10802'],
  ],
  'bambu-pla-matte': [
    ['Ivory White', '#FFFFFF', '11100'],
    ['Charcoal', '#000000', '11101'],
    ['Ash Gray', '#9B9EA0', '11102'],
    ['Lilac Purple', '#AE96D4', '11700', { verified: true }],
    ['Sakura Pink', '#E8AFCF', '11201', { verified: true }],
    ['Ice Blue', '#A3D8E1', '11601'],
    ['Marine Blue', '#0078BF', '11600'],
    ['Dark Blue', '#042F56', '11602'],
    ['Scarlet Red', '#DE4343', '11200'],
    ['Mandarin Orange', '#F99963', '11300'],
    ['Lemon Yellow', '#F7D959', '11400'],
    ['Grass Green', '#61C680', '11500'],
    ['Apple Green', '#C2E189', '11502'],
    ['Desert Tan', '#E8DBB7', '11401'],
    ['Latte Brown', '#D3B7A7', '11800'],
    ['Dark Chocolate', '#4D3324', '11801'],
    ['Terracotta', '#B15533', '11203'],
    ['Plum', '#851A52', '11204'],
  ],
  'bambu-pla-silk': [
    ['Silk Gold', '#F4A925', '13400', { finish: 'silk' }],
    ['Silk Silver', '#C8C8C8', '13101', { finish: 'silk' }],
    ['Silk Mint', '#96DCB9', '13501', { finish: 'silk' }],
    ['Silk Rose Gold', '#BA9594', '13201', { finish: 'silk' }],
  ],
  'bambu-pla-translucent': [
    ['Translucent Clear', '#F2F4F5', undefined, { transparency: 'clear' }],
    ['Translucent Blue', '#4A8FD8', undefined, { transparency: 'translucent' }],
    ['Translucent Red', '#D93B3B', undefined, { transparency: 'translucent' }],
  ],
  'bambu-petg-hf': [
    ['White', '#FFFFFF', '33100'],
    ['Black', '#000000', '33101'],
    ['Red', '#EB3A3A', '33200'],
    ['Blue', '#002E96', '33600'],
    ['Yellow', '#FFD00B', '33400'],
    ['Green', '#00AE42', '33500'],
  ],
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const filaments: Filament[] = Object.entries(lines).flatMap(([lineId, rows]) => {
  const line = productLines.find((l) => l.id === lineId)!
  return rows.map(([colorName, hex, code, opts]) => ({
    id: `${lineId}-${slug(colorName)}`,
    manufacturerId: line.manufacturerId,
    productLineId: line.id,
    material: line.material as Material,
    colorName,
    colorCode: code,
    hex: hex.toUpperCase(),
    hexVerified: opts?.verified ?? false,
    finish: opts?.finish ?? line.finish,
    transparency: opts?.transparency ?? 'opaque',
    notes: opts?.notes,
  }))
})
