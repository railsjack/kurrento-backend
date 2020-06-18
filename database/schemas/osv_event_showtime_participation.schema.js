import {Schema} from "mongoose";

const osvEventShowtimeParticiSchema = new Schema({
    event_id: {
        type: String
    },
    showtime_id: {
        type: String
    },
    start_time: {
        type: Date
    },
    is_live: {
        type: Boolean
    },
    attendance_type: {
        type: String
    },
    audience_room_video_resolution: {
        type: String
    },
    audience_room_participant_count: {
        type: Number
    }
});

export default osvEventShowtimesSchema;
