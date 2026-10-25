
import {
  InvitationError,
  inviteUser,
  getWorldMembers,
  getMyInvitations,
  acceptInvitation,
} from "../services/invitationService.js";

function handleError(error, res, next) {
  if (error instanceof InvitationError) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
    });
  }

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Membership already exists.",
    });
  }

  next(error);
}

// -----------------------------------------
// Invite user
// -----------------------------------------

export async function invite(req, res, next) {
  try {
    const invitation = await inviteUser({
      worldId: req.params.worldId,
      actorId: req.user.id,
      username: req.body?.username,
    });

    return res.status(201).json({
      success: true,
      message: "Invitation created.",
      data: { invitation },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
}

// -----------------------------------------
// View world members
// -----------------------------------------

export async function members(req, res, next) {
  try {
    const result = await getWorldMembers(
      req.params.worldId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: { members: result },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
}

// -----------------------------------------
// My pending invitations
// -----------------------------------------

export async function myInvitations(req, res, next) {
  try {
    const invitations = await getMyInvitations(
      req.user.id
    );

    return res.status(200).json({
      success: true,
      data: { invitations },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
}

// -----------------------------------------
// Accept an invitation
// -----------------------------------------

export async function accept(req, res, next) {
  try {
    const membership = await acceptInvitation(
      req.params.membershipId,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Invitation accepted.",
      data: { membership },
    });
  } catch (error) {
    return handleError(error, res, next);
  }
}
