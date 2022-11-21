export default class FullUserDto {
  _id;
  email;
  fullName;
  avatarUrl;
  imageCoverUrl;
  phoneNumber;
  deteOfBirth;
  isActivated;
  constructor(model) {
    this._id = model._id;
    this.email = model.email;
    this.fullName = model.fullName;
    this.avatarUrl = model.avatarUrl;
    this.imageCoverUrl = model.imageCoverUrl;
    this.phoneNumber = model.phoneNumber;
    this.deteOfBirth = model.deteOfBirth;
    this.isActivated = model.isActivated;
  }
}
