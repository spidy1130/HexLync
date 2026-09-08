import { clerkClient, getAuth } from "@clerk/express"
import {sql} from "../config/db.js"

export const protect = async (req, res, next) =>{
    const auth = getAuth(req);
    const userId = auth?.userId || req.auth?.userId;

    if(!userId){
        return res.status(401).json({ error: "Not authorized, authentication required" });
    }

    req.user = {id: userId};

    const userActivePlan = auth.has({plan: "sync"}) ? "sync" : "free";

    // Webhooks normally create this row at sign-up. Ensure an authenticated
    // user can still proceed if webhook delivery was delayed or missed.
    let users = await sql`SELECT name, plan FROM users WHERE id = ${userId}`

    if (users.length === 0) {
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses.find(
            (item) => item.id === clerkUser.primaryEmailAddressId
        )?.emailAddress;

        if (!email) {
            return res.status(400).json({
                error: "The signed-in user does not have an email address.",
            });
        }

        const name = [clerkUser.firstName, clerkUser.lastName]
            .filter(Boolean)
            .join(" ") || "User";

        const usersWithEmail = await sql`
            SELECT id
            FROM users
            WHERE email = ${email}
        `;

        if (usersWithEmail.length > 0) {
            // The same verified email can have a stale Clerk ID after an
            // account is recreated. Update the ID; dependent rows cascade.
            await sql`
                UPDATE users
                SET id = ${userId},
                    name = ${name},
                    image = ${clerkUser.imageUrl || ""},
                    updated_at = NOW()
                WHERE email = ${email}
            `;
        } else {
            await sql`
                INSERT INTO users (id, name, email, image, plan)
                VALUES (${userId}, ${name}, ${email}, ${clerkUser.imageUrl || ""}, ${"free"})
                ON CONFLICT (id) DO NOTHING
            `;
        }

        users = await sql`SELECT name, plan FROM users WHERE id = ${userId}`;
    }

    const userPlan = users[0]?.plan;

    if(userActivePlan !== userPlan){
        await sql`UPDATE users SET plan = ${userActivePlan} WHERE id = ${userId}`
    }


    next()
}
