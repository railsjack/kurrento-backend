import mongoose from 'mongoose';
import osvUserOauthLinkSchema from '../schemas/osv_user_oauth_link.schema';

const osvUserOauthLink = mongoose.model('osv_user_oauth_link', osvUserOauthLinkSchema);
export default osvUserOauthLink;
