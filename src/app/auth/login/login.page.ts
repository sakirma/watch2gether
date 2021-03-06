import {AuthResponse} from '../../interfaces/auth-response';
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

import {UserService} from '../../services/user/user.service';


@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
})

export class LoginPage implements OnInit {
    public loginFormGroup: FormGroup;
    public registerFormGroup: FormGroup;

    public isRegistering: boolean;

    constructor(private formBuilder: FormBuilder, private router: Router, private userService: UserService) {
        this.isRegistering = false;
    }

    ngOnInit(): void {
        this.loginFormGroup = this.formBuilder.group({
            email: ['', Validators.required],
            password: ['', Validators.required],
        });

        this.registerFormGroup = this.formBuilder.group({
            email: ['', Validators.required],
            password: ['', Validators.required],
            confirmPassword: ['', Validators.required],
        }, {
            validator: this.MatchPassword
        });
    }

    MatchPassword(FG: FormGroup) {
        const password = FG.get('password').value; // to get value in input tag
        const confirmPassword = FG.get('confirmPassword').value; // to get value in input tag
        if (password !== confirmPassword) {
            FG.get('confirmPassword').setErrors({MatchPassword: true})
        } else {
            return null
        }
    }

    onLoginSuccess(response: AuthResponse): void {
        this.router.navigate(['rooms']);
    }

    logForm(): void {
        this.userService.login(this.loginFormGroup.get('email').value, this.loginFormGroup.get('password').value, (response: AuthResponse) => {
            this.onLoginSuccess(response)
        });
    }

    registerForm(): void {
        this.userService.signUpUser(this.registerFormGroup.get('email').value, this.registerFormGroup.get('password').value, (response: AuthResponse) => {
            this.onLoginSuccess(response)
        });
    }

    stateRegister(): void {
        this.isRegistering = true;
    }

    stateLogin(): void {
        this.isRegistering = false;
    }
}
