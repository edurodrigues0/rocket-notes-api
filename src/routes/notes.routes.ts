import { Router } from 'express'
import NotesController from '../controllers/notes-controller'

const notesRouter = Router()
const notesController = new NotesController()

notesRouter.post('/:user_id', notesController.create)
notesRouter.get('/:id', notesController.show)

export default notesRouter