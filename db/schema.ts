// Intentionally empty by default.
// Add Drizzle tables here when the site actually needs a database.
// See examples/d1/db/schema.ts for an opt-in example.
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
export const jobs = sqliteTable('jobs', {
 id: text('id').primaryKey(), company: text('company').notNull(),
 title: text('title').notNull(), recruitmentType: text('recruitment_type').notNull(),
 locations: text('locations').notNull(), searchText: text('search_text').notNull(),
 payload: text('payload').notNull(),
}, t => [index('jobs_company_idx').on(t.company), index('jobs_stage_idx').on(t.recruitmentType)]);
