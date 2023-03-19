import { Request, Response } from "express";
import { validationResult } from "express-validator";
import { PipelineStage } from "mongoose";
import userSchema from "../../utills/schema/user";
import {
  isValidObjectId,
  ObjectId,
  encrypt,
  TypeObjectId,
} from "../../utills/helper";

type FacetPipelineStage = PipelineStage.FacetPipelineStage

type Activity = {
  lastLoggedIn: Number,
  lastLoggedOut: Number,
};

type User = {
  adminId?: TypeObjectId,
  name: string,
  email: string,
  password?: string,
  timeStamps?: number,
  activity?: Activity,
  status?: number,
  _id?: TypeObjectId,
};

type UserQuery = {
  skip?: number,
  limit?: number,
  sortField?: string,
  order?: 1 | -1,
  search?: string,
};

export const addUpdateUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    let {
      name = "",
      email = "",
      password = "",
      status = 1,
      _id,
    }: User = req?.body;
    const { loginId } = req.params || {};
    email = `${email}`.toLowerCase();

    const obj: Partial<User> = {};
    obj.adminId = ObjectId(loginId);
    obj.name = name;
    obj.email = email;
    obj.status = +status;

    if (password) {
      obj.password = encrypt(password);
    }
    if (_id) {
      if (isValidObjectId(_id)) {
        const alreadyUser = await userSchema.find(
          { email, _id: { $ne: ObjectId(_id) } },
          { _id: 1 }
        );
        if (alreadyUser?.length > 0) {
          return res
            .status(200)
            .json({ status: "0", message: `${email} already exists` });
        }
        const update = await userSchema.updateMany({ _id: ObjectId(_id) }, obj);
        if (update.modifiedCount > 0) {
          res
            .status(200)
            .json({ status: "1", message: "User updated successfully" });
        } else {
          res.status(200).json({ status: "0", message: "User not updated" });
        }
      } else {
        res.status(200).json({ status: "0", message: "Id is not a valid id" });
      }
    } else {
      if (!password) {
        return res
          .status(200)
          .json({ status: "0", message: "Password is required" });
      }
      const alreadyUser = await userSchema.find({ email }, { _id: 1 });
      if (alreadyUser?.length > 0) {
        return res
          .status(200)
          .json({ status: "0", message: `${email} already exists` });
      }
      obj.timeStamps = +new Date();

      const addUser = await userSchema.create(obj);
      if (addUser?._id) {
        return res.status(200).json({
          status: "1",
          message: "User added successfully",
          data: addUser,
        });
      } else {
        res.status(200).json({ status: "0", message: "User not added" });
      }
    }
  } catch (error) {
    console.error(`Error in add users ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};


export const getUser = async (req: Request, res: Response) => {
  try {
    const { id: _id } = req.params || {};
    if (!isValidObjectId(_id)) {
      return res.status(200).json({ status: "0", message: "ID is required." });
    }
    const getUserData = await userSchema.findOne(
      { _id: ObjectId(_id) },
      { _id: 1, name: 1, email: 1 }
    );
    if (getUserData?._id) {
      return res.status(200).json({ status: "1", data: getUserData });
    } else {
      return res.status(200).json({ status: "0", message: "User not found" });
    }
  } catch (error) {
    console.error(`Error in getUser ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};

export const dashboard = async (req: Request, res: Response) => {
  try {
    const { loginId } = req.params || {};
    const [active, inActive] = await Promise.all([
      userSchema.countDocuments({ adminId: ObjectId(loginId), status: 1 }),
      userSchema.countDocuments({ adminId: ObjectId(loginId), status: 0 }),
    ]);
    return res.status(200).json({ status: "1", data: { active, inActive } });
  } catch (error) {
    console.error(`Error in dashboard ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};

export const getList = async (req: Request, res: Response) => {
  try {
    const {
      limit = 10,
      skip = 0,
      search = "",
      sortField = "createdAt",
    }: UserQuery = req.query || {};
    const order = +(req.query?.order || -1) as UserQuery['order'];
    const { loginId } = req.params || {};

    const query: FacetPipelineStage[] = [];
    let withoutLimit: FacetPipelineStage[] = [];
    let activeCount: FacetPipelineStage[] = [];
    let inActiveCount: FacetPipelineStage[] = [];
    const userQuery: PipelineStage[] = [];

    query.push({ $match: { adminId: { $eq: ObjectId(loginId) } } });

    if (search) {
      query.push({
        $match: {
          $or: [
            { name: { $regex: search + ".*", $options: "si" } },
            { email: { $regex: search + ".*", $options: "si" } },
          ],
        },
      });
    }

    withoutLimit = [...query];
    activeCount = [...query];
    inActiveCount = [...query];
    withoutLimit.push({ $count: "all" });
    activeCount.push({ $match: { status: { $eq: 1 } } }, { $count: "active" });
    inActiveCount.push({ $match: { status: { $eq: 0 } } }, { $count: "inActive" });    
    
    query.push(
      { $sort: { [sortField]: order || -1 } },
      { $skip: +skip },
      { $limit: +limit },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          status: 1,
        },
      },
    );

    userQuery.push({
      $facet: {
        all: withoutLimit,
        active: activeCount,
        inActive: inActiveCount,
        result: query
      }
    });

    const data = await userSchema.aggregate(userQuery);
    return res.status(500).json({ status: "1", data });
  } catch (error) {
    console.error(`Error in get list ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { _id } = req.body || {};
    const deleteUserData = await userSchema.deleteMany({ _id: { $in: _id } });
    if (deleteUserData.deletedCount > 0) {
      return res
        .status(200)
        .json({ status: "1", message: "User deleted successfully" });
    } else {
      return res.status(200).json({ status: "0", message: "User not deleted" });
    }
  } catch (error) {
    console.error(`Error in deleteUser ${error}`);
    return res.status(500).json({ status: "0", message: error });
  }
};
