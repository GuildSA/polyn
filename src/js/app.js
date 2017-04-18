
var APPLICATION_ID = '4BE04D0E-06FB-A8F0-FFB5-63FD97238000';
var SECRET_KEY = 'A0D27272-DDD7-7525-FF80-C0ECE0BF8D00';
var VERSION = 'v1';

Backendless.initApp(APPLICATION_ID, SECRET_KEY, VERSION);

// var user = new Backendless.User();
// user.email = "polymer@backendless.com";
// user.password = "pass";
// Backendless.UserService.register(user);

function Venue(args) {

    args = args || {};

    this.name = args.objectId || "";
    this.name = args.venueCode || "";
    this.name = args.venueItemName || "";
    this.name = args.logoUrl || "";
    this.name = args.title || "";
    this.name = args.subTitle || "";
    this.name = args.desc || "";
    this.name = args.address || "";
    this.name = args.location || null;
    this.name = args.phone || "";
    this.name = args.email || "";
    this.name = args.webUrl || "";
    this.name = args.geofences || "";
    this.name = args.extras || "";
}

function VenueItem(args) {

    args = args || {};

    this.name = args.objectId || "";
    this.name = args.venueCode || "";
    this.name = args.logoUrl || "";
    this.name = args.title || "";
    this.name = args.subTitle || "";
    this.name = args.desc || "";
    this.name = args.address || "";
    this.name = args.location || null;
    this.name = args.phone || "";
    this.name = args.email || "";
    this.name = args.webUrl || "";
    this.name = args.geofences || "";
    this.name = args.extras || "";
}
