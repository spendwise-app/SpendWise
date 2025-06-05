import User from "../models/userModel.js";

export const sendRequest = async (req, res) => {
  const { email } = req.params;
  const senderId = req.userId;

  const receiver = await User.findOne({ email });
  if (!receiver) return res.status(404).json({ message: "User not found" });

  if (
    receiver.friendRequests.includes(senderId) ||
    receiver.friends.includes(senderId)
  )
    return res.status(400).json({ message: "Already requested or friends" });

  receiver.friendRequests.push(senderId);
  await receiver.save();

  const sender = await User.findById(senderId);
  sender.sentRequests.push(receiver._id);
  await sender.save();

  res.json({ message: "Friend request sent" });
};

export const acceptRequest = async (req, res) => {
  const senderId = req.params.id;
  const receiverId = req.userId;

  const sender = await User.findById(senderId);
  const receiver = await User.findById(receiverId);

  if (!receiver.friendRequests.includes(senderId))
    return res.status(400).json({ message: "No such request" });

  // Update both users
  receiver.friends.push(senderId);
  receiver.friendRequests = receiver.friendRequests.filter(id => id != senderId);

  sender.friends.push(receiverId);
  sender.sentRequests = sender.sentRequests.filter(id => id != receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: "Friend request accepted" });
};


export const rejectRequest = async (req, res) => {
  const senderId = req.params.id;
  const receiverId = req.userId;

  const receiver = await User.findById(receiverId);
  const sender = await User.findById(senderId);

  receiver.friendRequests = receiver.friendRequests.filter(id => id != senderId);
  sender.sentRequests = sender.sentRequests.filter(id => id != receiverId);

  await receiver.save();
  await sender.save();

  res.json({ message: "Friend request rejected" });
};

