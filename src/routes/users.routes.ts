import { Router } from 'express'
import UsersController from '../controllers/users-controllers'
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated'

const usersRouter = Router()
const usersController = new UsersController()

usersRouter.post('/', usersController.create)
usersRouter.put('/', ensureAuthenticated, usersController.update)

export default usersRouter