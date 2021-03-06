import {UserService} from '../user/user.service';
import {AllMessagesInterface, RoomInterface} from '../../interfaces/room-response';
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {RoomsResponse} from '../../interfaces/rooms-response';
import {Injectable} from '@angular/core';
import {RoomResponse} from 'src/app/interfaces/room-response';
import {ActivatedRoute, Router} from '@angular/router';
import {RoomSocketService} from './room-socket.service';
import {YoutubeInformation} from '../../rooms/youtubePlayer/youtube-information';

@Injectable({
    providedIn: 'root'
})
export class RoomService {
    public player: YT.Player;

    public newMsg = '';
    public messages: Array<any>;
    public rooms: Array<any>;
    public links: { link: string, title: string }[] = [];

    public selectedRoom: RoomInterface;

    constructor(
        private httpClient: HttpClient,
        private router: Router,
        private activateRoute: ActivatedRoute,
        private userService: UserService,
        private roomSocket: RoomSocketService
    ) {
        this.messages = new Array<any>();
        this.roomSocket.roomService = this;


        if (roomSocket.onMessageReceived.length !== 2)
            roomSocket.onMessageReceived.push((username, message) => this.OnMessageReceived(username, message));
    }

    public async getRooms(page: number, id: string) {
        const userParam = (id !== undefined) ? `&user=${id}` : '';

        await this.httpClient.get<RoomsResponse>(environment.serverURL + `/rooms?pageIndex=${page}` + userParam)
            .toPromise().then((value) => {
                this.rooms = value.rooms;
            });
    }

    public OpenRoomPage(response: RoomInterface) {
        this.selectedRoom = response;
        this.router.navigate(['/rooms', response.id]);
    }

    public async CreateRoom(name: string, password: string, categoriesUnfiltered: string): Promise<RoomResponse> {

        const categories = categoriesUnfiltered.split(',');
        return await this.httpClient.post<RoomResponse>(environment.serverURL + '/rooms', {name, password, categories}).toPromise();
    }

    public async getRoom(roomId: string): Promise<RoomInterface> {
        const roomResponse = await this.httpClient.get<RoomResponse>(
            `${environment.serverURL}/rooms/` + roomId,
            {}
        ).toPromise();

        return roomResponse.room;
    }

    public async deleteRoom(): Promise<string> {
        const roomResponse = await this.httpClient.delete<RoomResponse>(
            `${environment.serverURL}/rooms/${this.selectedRoom.id}`).toPromise();
        return roomResponse.statusCode.toString();
    }


    public async updateRoom(room: ({ name: string, password: string })): Promise<RoomResponse> {
        return await this.httpClient.put<RoomResponse>(`${environment.serverURL}/rooms/${this.selectedRoom.id}`, room).toPromise();
    }

    public async getMessages() {
        const url = `${environment.serverURL}/rooms/${this.selectedRoom.id}/messages`;

        await this.httpClient.get<AllMessagesInterface>(url).toPromise().then((value) => {
            this.messages = value.messages;
        });

    }

    public async setUser(roomId: string, password: string): Promise<RoomResponse> {
        return await this.httpClient
            .post<RoomResponse>(`${environment.serverURL}/rooms/` + roomId + '/users',
                {user: this.userService.currentUser.user.id, password}).toPromise()
    }

    public async removeUser(): Promise<RoomResponse> {
        return await this.httpClient.delete<RoomResponse>
        (`${environment.serverURL}/rooms/${this.selectedRoom.id}/users/${this.userService.currentUser.user.name}_${this.userService.currentUser.user.discriminator}`).toPromise();
    }

    public OpenCreateRoomPage(): void {
        this.router.navigate(['createRoom']);
    }

    public OnMessageReceived(userName: string, message: string) {
        this.messages.push({
            sender: {name: userName},
            timestamp: new Date().getTime(),
            line: message
        });
    }

    public async setLinksOfRoom() {
        this.links = new Array<{ link: string, title: string }>(this.selectedRoom.queue.length);
        let index = 0;
        for (const queue of this.selectedRoom.queue) {
            this.links[index] = {link: 'loading', title: 'loading'};
            await this.httpClient.get<any>(`https://noembed.com/embed?url=${queue.link}`)
                .subscribe((json) => {
                    this.links[queue.position] = {link: queue.link, title: json.title};
                }, error => console.error(error));

            index++;
        }
    }

    public updateQueue(from: number, to: number) {
        const temp = this.links[from];

        this.links[from] = this.links[to];
        this.links[to] = temp;
        console.log(this.links)
    }

    public nextVideo() {
        this.links.shift();
    }

    public async getWebLocation(): Promise<any> {
        return await this.httpClient.get('https://ipinfo.io?token=d42a00ae8f9ae3').toPromise();
    }
}
