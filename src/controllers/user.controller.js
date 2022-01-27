// User model
const { User } = require('../database/db');
// Post model
const { Post, Job, WorkerPost, Pagos, Chat, Message } = require('../database/db');
const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;


// Crear usuario
const createUser = (req, res, next) => {
    // Cuerpo de la solicitud
    const dataUser = req.body;
    const { usr_id, usr_username, usr_email} = dataUser;
    if (!usr_id || !usr_username || !usr_email) return res.status(400).json({msg: "No data"});

    // Buscamos el usuario
    User.findOne({ where: { usr_username: dataUser.usr_username } })
        .then(response => {
            // Si existe no lo creamos
            if (response) return res.status(304).send('El usuario ya existe');

            // Creamos el nuevo usuario
            User.create({
                ...dataUser
            }).then(response => {
                // Devolvemos el usuario creado
                return res.status(200).json(response);

            }).catch(error => {
                return next(error);
            });

        }).catch(error => {
            return next(error);
        });
}

// Mostrar usuarios
const showUsers = (req, res, next) => {
    // Buscar todos los usuarios
    User.findAll({
        where: {
            usr_isActive: true
        },
        include: [{
            required: false,
            model: Job,
            attributes: {
                exclude: ['updatedAt','createdAt']
            },
            through: {
                attributes: []
            },
            where: {
                job_isActive: true
            }
        }, {
            required: false,
            model: Post,
            where: {
                post_isActive: true
            },
            attributes: {
                exclude: ['userUsrId','usr_id']
            }
        }, {
            required: false,
            model: WorkerPost,
            where: {
                wp_isActive: true
            },
            attributes: {
                exclude: ['userUsrId', 'usr_id']
            }
        }, {
            required: false,
            model: Chat,
            attributes: {
                exclude: ["User_Chat"]
            }
        }]
    })
        .then(response => {
            // Retornamos los usuarios encontrados
            return res.status(200).json(response);

        }).catch(error => {
            return next(error);
        });
}

// Mostrar usuario por id
const showUserById = (req, res, next) => {
    // UserId req.params
    const { userId } = req.params;
    if (!userId) return res.status(400).json({msg: "No user id"});

    // Buscamos el usuario por id
    User.findOne({
        where: {
            usr_id: userId
        },
        include: [{
            required: false,
            model: Job,
            where: {
                job_isActive: true
            },
            attributes: {
                exclude: ['updatedAt','createdAt']
            },
            through: {
                attributes: []
            }
        }, {
            required: false,
            model: Post,
            where: {
                post_isActive: true
            },
            attributes: {
                exclude: ['userUsrId','usr_id']
            }
        }, {
            required: false,
            model: WorkerPost,
            where: {
                wp_isActive: true
            },
            attributes: {
                exclude: ['userUsrId','usr_id']
            }
        },{
            required: false,
            model: Pagos,
            attributes: {
                exclude: ['userUsrId','usr_id']
            }
        }, {
            required: false,
            model: Chat,
            attributes: {
                exclude: ["User_Chat"]
            },
            include: [{
                required: false,
                model: User,
                attributes: ["usr_id", "usr_username"]
            }]
        }]
    })
        .then(user => res.json(user))
        .catch(error => next(error));
}

// Modificar usuarios
const modifyUser = (req, res, next) => {
    // userId req.params
    const { userId } = req.params;
    // Data a modificar
    const dataUser = req.body;
    if (!userId || !dataUser) return res.status(400).json({msg: "No user id"});

    // Buscamos el usuario por el id
    User.findByPk(userId)
        .then(user => {
            return user.update({ // Actualizamos el usuario con la data recibida por body
                ...dataUser
            })
        })
        .then(userUpdate => res.json(userUpdate)) // Mostramos le usuario actualizado
        .catch(error => next(error));
}

// Eliminar usuarios
const deleteUser = (req, res, next) => {
    // userId req.params
    const { userId } = req.params;
    if (!userId) return res.status(400).json({msg: "No user id"});

    // Buscamos el usuario
    User.findByPk(userId)
        .then(user => user.update({ usr_isActive: !user.usr_isActive })) // Cambiamos usr_isActive
        .then(response => res.sendStatus(200))
        .catch(error => next(error));
}

// Encontrar usuarios por sus oficios
const getUsersIdsByJobNames = async (data) => {
    const { post, jobs} = data;

    if (!post || !jobs) return [];
    const jobsDb = await Job.findAll({
        where: {
            job_name: {
                [Op.in]: jobs
            }
        },
        include: [{
            model: User,
        }]
    });
    const jobsUsers = jobsDb.map(job => job.users)
    const usersIds = jobsUsers.flat().map(user => user.usr_id);
    return usersIds;
}

module.exports = {
    createUser,
    showUsers,
    showUserById,
    getUsersIdsByJobNames,
    modifyUser,
    deleteUser
}