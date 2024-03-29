import { z } from 'zod'
import { knex } from '../database'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '../utils/errors/AppError'

class NotesController {
  async create(request: Request, response: Response) {
    const createNotesBodySchema = z.object({
      title: z.string(),
      description: z.string().optional(),
      tags: z.string().array(),
      links: z.string().array()
    })

    const { 
      title, 
      description, 
      tags, 
      links 
    } = createNotesBodySchema.parse(request.body)
    const user_id = request.user.id

    const id = uuidv4()

    const user = await knex("users").where({ id: user_id }).first()

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404)
    }

    await knex('notes').insert({
      id,
      title,
      description,
      user_id
    });

    const linksInsert = links.map((link: string) => {
      return {
        id: uuidv4(),
        note_id: id,
        url: link
      }
    })

    await knex('links').insert(linksInsert)

    const tagsInsert = tags.map((name: string) => {
      return {
        id: uuidv4(),
        note_id: id,
        user_id,
        name
      }
    })

    await knex('tags').insert(tagsInsert)

    response.status(201).json();
  }

  async show(request: Request, response: Response) {
    const showParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = showParamsSchema.parse(request.params)

    const note = await knex("notes").where({ id }).first()
    const tags = await knex("tags").where({ note_id: id }).orderBy("name")
    const links = await knex("links").where({ note_id: id }).orderBy("created_at")

    return response.json({
      ...note,
      tags,
      links
    })
  }

  async delete(request: Request, response: Response) {
    const deleteParamsSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = deleteParamsSchema.parse(request.params)

    await knex("notes").where({ id }).delete()

    return response.status(204).json()
  }

  async index(request: Request, response: Response) {
    const indexQuerySchema = z.object({
      user_id: z.string().uuid(),
      title: z.string().optional(),
      tags: z.string().optional()
    })
    const user_id = request.user.id
    const { title, tags } = indexQuerySchema.parse(request.query)
    
    const user = await knex("users").where({ id: user_id }).first()

    if (!user) {
      throw new AppError("Usuário não encontrado.", 404)
    }

    let notes

    if (tags) {
      const filterTags = tags.split(',').map(tag => tag.trim())
      notes = await knex("tags")
      .select([
        "notes.id",
        "notes.title",
        "notes.user_id",
      ])
      .where("notes.user_id", user_id)
      .modify(builder => {
        if (title) {
          builder.whereLike("notes.title", `%${title}%`)
        }
      })
      .whereIn("name", filterTags)
      .innerJoin("notes", "notes.id", "tags.note_id")
      .orderBy("notes.title")
    } else {
      notes = await knex("notes")
      .modify(builder => {
        if (title) {
          builder.whereLike("title", `%${title}%`)
        }
      })
      .where({ user_id })
      .select([
        "id",
        "title",
        "user_id",
      ])
      .orderBy("title")
    }

    const userTags = await knex("tags").where({ user_id })
    const notesWithTags = notes.map((note: { id: string }) => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id)

      return {
        ...note,
        tags: noteTags
      }
    })


    return response.json(notesWithTags)
  }
}

export default NotesController