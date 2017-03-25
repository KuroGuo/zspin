const express = require('express')
const config = require('config')

const requireLogin = require('../middlewares/require-login')

const router = express.Router()

router.get('/', requireLogin, async function (req, res, next) { try {
  const User = req.app.db.User
  const WithdrawalRequest = req.app.db.WithdrawalRequest
  const ClaimRequest = req.app.db.ClaimRequest

  const values = await Promise.all([
    User.count(),
    WithdrawalRequest.count(),
    ClaimRequest.count()
  ])

  const totalUsersCount = values[0]
  const pendingWithdrawalRequestsCount = values[1]
  const pendingClaimRequestsCount = values[2]

  res.render('dashborad', {
    totalUsersCount,
    pendingWithdrawalRequestsCount,
    pendingClaimRequestsCount
  })
} catch (err) { next(err) } })

router.get('/withdrawal-requests/pending', async function (req, res, next) { try {
  const User = req.app.db.User
  const WithdrawalRequest = req.app.db.WithdrawalRequest

  const withdrawalRequests = await WithdrawalRequest.findAll({
    include: [User]
  })

  res.render('withdrawal-requests/pending', {
    withdrawalRequests
  })
} catch (err) { next(err) } })

router.get('/withdrawal-requests/review/:id', async function (req, res, next) { try {
  const id = req.params.id

  const WithdrawalRequest = req.app.db.WithdrawalRequest
  const User = req.app.db.User
  const Record = req.app.db.Record

  const withdrawalRequest = await WithdrawalRequest.findById(id, {
    include: [{
      model: User,
      include: [{
        model: Record,
        where: { type: 'zcoin' }
      }]
    }]
  })

  const recordIds = withdrawalRequest.user.records.map(r => r.id).join(',')

  const amount = withdrawalRequest.user.records
    .map(r => parseFloat(r.amount))
    .reduce((a, b) => a + b)
    .toFixed(2)

  res.render('withdrawal-requests/review', {
    withdrawalRequest,
    recordIds,
    amount
  })
} catch (err) { next(err) } })

router.post('/withdrawal-requests/review/resolve/:id', async function (req, res, next) { try {
  const id = parseFloat(req.params.id)
  const amount = req.body.amount
  const recordIds = req.body.recordIds
  const txid = req.body.txid

  const sequelize = req.app.db.sequelize
  const WithdrawalRequest = req.app.db.WithdrawalRequest
  const WithdrawalRequestResolved = req.app.db.WithdrawalRequestResolved
  const Record = req.app.db.Record

  const withdrawalRequest = await WithdrawalRequest.findById(id, {
    include: [
      {
        model: WithdrawalRequestResolved,
        required: false
      }
    ]
  })

  if (!withdrawalRequest) {
    return res.render('message', {
      message: 'Non-exist withdrawal request ID'
    })
  }

  sequelize.transaction({
    type: sequelize.constructor.Transaction.EXCLUSIVE
  }, async function (transaction) {
    let withdrawalRequestResolved = withdrawalRequest.withdrawalRequestResolved

    if (withdrawalRequestResolved) {
      withdrawalRequestResolved.amount = amount
      withdrawalRequestResolved.txid = txid
      await withdrawalRequestResolved.save({ transaction })
    } else {
      withdrawalRequestResolved = await withdrawalRequest.createWithdrawalRequestResolved({
        amount,
        txid
      }, {
        transaction
      })
    }

    await Record.update({
      sent: true
    }, {
      where: { id: { $in: recordIds.split(',') } },
      transaction
    })

    const records = await Record.findAll({
      where: { id: { $in: recordIds.split(',') } },
      transaction,
      attributes: ['id']
    })

    withdrawalRequest.status = 'resolved'

    await Promise.all([
      withdrawalRequest.save({ transaction }),
      withdrawalRequestResolved.addRecords(records, {
        transaction
      })
    ])
  }).then(() => {
    res.send('<script>window.opener.location.reload(true); window.close()</script>')
  }).catch(err => {
    next(err)
  })
} catch (err) { next(err) } })

router.get('/withdrawal-requests/resolved', async function (req, res, next) { try {
  const WithdrawalRequest = req.app.db.WithdrawalRequest
  const WithdrawalRequestResolved = req.app.db.WithdrawalRequestResolved
  const User = req.app.db.User

  const withdrawalRequests = await WithdrawalRequest.findAll({
    where: { status: 'resolved' },
    include: [WithdrawalRequestResolved, User]
  })

  res.render('withdrawal-requests/resolved', {
    withdrawalRequests
  })
} catch (err) { next(err) } })

router.get('/withdrawal-requests/rejected', async function (req, res, next) { try {
  const WithdrawalRequest = req.app.db.WithdrawalRequest
  const WithdrawalRequestResolved = req.app.db.WithdrawalRequestResolved
  const User = req.app.db.User

  const withdrawalRequests = await WithdrawalRequest.findAll({
    where: { status: 'rejected' },
    include: [User]
  })

  res.render('withdrawal-requests/rejected', {
    withdrawalRequests
  })
} catch (err) { next(err) } })

router.post('/withdrawal-requests/review/reject/:id', async function (req, res, next) { try {
  const id = parseFloat(req.params.id)

  const WithdrawalRequest  = req.app.db.WithdrawalRequest

  await WithdrawalRequest.update({
    status: 'rejected'
  }, {
    where: { id }
  })

  res.send('<script>window.opener.location.reload(true); window.close()</script>')
} catch (err) { next(err) } })

router.get('/claim-requests/pending', async function (req, res, next) { try {
  const User = req.app.db.User
  const ClaimRequest = req.app.db.ClaimRequest

  const claimRequests = await ClaimRequest.findAll({
    include: [User]
  })

  res.render('claim-requests/pending', {
    claimRequests
  })
} catch (err) { next(err) } })

router.get('/claim-requests/review/:id', async function (req, res, next) { try {
  const id = req.params.id

  const ClaimRequest = req.app.db.ClaimRequest
  const User = req.app.db.User
  const Record = req.app.db.Record

  const claimRequest = await ClaimRequest.findById(id, {
    include: [{
      model: User,
      include: [{
        model: Record,
        where: { type: 't_shirt' }
      }]
    }]
  })

  const recordIds = claimRequest.user.records.map(r => r.id).join(',')

  const amount = claimRequest.user.records
    .map(r => parseFloat(r.amount))
    .reduce((a, b) => a + b)
    .toFixed(2)

  res.render('claim-requests/review', {
    claimRequest,
    recordIds,
    amount
  })
} catch (err) { next(err) } })

router.post('/claim-requests/review/resolve/:id', async function (req, res, next) { try {
  const id = parseFloat(req.params.id)
  const amount = req.body.amount
  const recordIds = req.body.recordIds
  const tracking = req.body.tracking

  const sequelize = req.app.db.sequelize
  const ClaimRequest = req.app.db.ClaimRequest
  const ClaimRequestResolved = req.app.db.ClaimRequestResolved
  const Record = req.app.db.Record

  const claimRequest = await ClaimRequest.findById(id, {
    include: [
      {
        model: ClaimRequestResolved,
        required: false
      }
    ]
  })

  if (!claimRequest) {
    return res.render('message', {
      message: 'Non-exist claim request ID'
    })
  }

  sequelize.transaction({
    type: sequelize.constructor.Transaction.EXCLUSIVE
  }, async function (transaction) {
    let claimRequestResolved = claimRequest.claimRequestResolved

    if (claimRequestResolved) {
      claimRequestResolved.amount = amount
      claimRequestResolved.tracking = tracking
      await claimRequestResolved.save({ transaction })
    } else {
      claimRequestResolved = await claimRequest.createClaimRequestResolved({
        amount,
        tracking
      }, {
        transaction
      })
    }

    await Record.update({
      sent: true
    }, {
      where: { id: { $in: recordIds.split(',') } },
      transaction
    })

    const records = await Record.findAll({
      where: { id: { $in: recordIds.split(',') } },
      transaction,
      attributes: ['id']
    })

    claimRequest.status = 'resolved'

    await Promise.all([
      claimRequest.save({ transaction }),
      claimRequestResolved.addRecords(records, {
        transaction
      })
    ])
  }).then(() => {
    res.send('<script>window.opener.location.reload(true); window.close()</script>')
  }).catch(err => {
    next(err)
  })
} catch (err) { next(err) } })

router.get('/claim-requests/resolved', async function (req, res, next) { try {
  const ClaimRequest = req.app.db.ClaimRequest
  const ClaimRequestResolved = req.app.db.ClaimRequestResolved
  const User = req.app.db.User

  const claimRequests = await ClaimRequest.findAll({
    where: { status: 'resolved' },
    include: [ClaimRequestResolved, User]
  })

  res.render('claim-requests/resolved', {
    claimRequests
  })
} catch (err) { next(err) } })

router.get('/claim-requests/rejected', async function (req, res, next) { try {
  const ClaimRequest = req.app.db.ClaimRequest
  const ClaimRequestResolved = req.app.db.ClaimRequestResolved
  const User = req.app.db.User

  const claimRequests = await ClaimRequest.findAll({
    where: { status: 'rejected' },
    include: [User]
  })

  res.render('claim-requests/rejected', {
    claimRequests
  })
} catch (err) { next(err) } })

router.post('/claim-requests/review/reject/:id', async function (req, res, next) { try {
  const id = parseFloat(req.params.id)

  const ClaimRequest  = req.app.db.ClaimRequest

  await ClaimRequest.update({
    status: 'rejected'
  }, {
    where: { id }
  })

  res.send('<script>window.opener.location.reload(true); window.close()</script>')
} catch (err) { next(err) } })

router.get('/login', (req, res) => {
  res.render('login')
})

router.post('/login', (req, res) => {
  const password = req.body.password

  if (password !== config.get('admin.password')) {
    return res.render('message', { message: 'Password error' })
  }

  req.session.logined = true

  res.redirect('/')
})

router.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

module.exports = router
