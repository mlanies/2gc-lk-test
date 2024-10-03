import IconInput from "@/common/components/IconInput";
import "./styles.sass";
import { mdiAccountCircleOutline } from "@mdi/js";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "@/common/contexts/UserContext.jsx";
import Button from "@/common/components/Button";
import { patchRequest, postRequest } from "@/common/utils/RequestUtil.js";
import TwoFactorAuthentication from "@/pages/Settings/pages/Account/dialogs/TwoFactorAuthentication";
import PasswordChange from "@/pages/Settings/pages/Account/dialogs/PasswordChange";

export const Account = () => {

    const [twoFactorOpen, setTwoFactorOpen] = useState(false);
    const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);

    const { user, login } = useContext(UserContext);

    const [updatedField, setUpdatedField] = useState(null);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const updateName = (config) => {
        if (config.firstName && config.firstName === user.firstName) return;
        if (config.lastName && config.lastName === user.lastName) return;

        patchRequest(`accounts/name`, config)
            .then(() => {
                login();
                setUpdatedField(Object.keys(config)[0]);

                setTimeout(() => {
                    setUpdatedField(null);
                }, 1500);
            })
            .catch(err => console.error(err));
    }

    const disable2FA = () => {
        postRequest("accounts/totp/disable").then(() => {
                login();
            }).catch(err => console.error(err));
    }

    useEffect(() => {
        if (user) {
            setFirstName(user.firstName);
            setLastName(user.lastName);
        }
    }, [user]);

    return (
        <div className="account-page">
            <TwoFactorAuthentication open={twoFactorOpen} onClose={() => setTwoFactorOpen(false)} />
            <PasswordChange open={passwordChangeOpen} onClose={() => setPasswordChangeOpen(false)} />
            <div className="account-section">
                <h2>Имя учетной записи</h2>
                <div className="section-inner">
                    <div className="form-group">
                        <label htmlFor="firstName">Имя</label>
                        <IconInput icon={mdiAccountCircleOutline} placeholder="First name"
                                      id="firstName" customClass={updatedField === "firstName" ? " fd-updated" : ""}
                                   value={firstName} setValue={setFirstName}
                                   onBlur={(event) => updateName({ firstName: event.target.value })}   />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastName">Фамилия</label>
                        <IconInput icon={mdiAccountCircleOutline} placeholder="Last name" id="lastName"
                                      value={lastName} setValue={setLastName}
                                        customClass={updatedField === "lastName" ? " fd-updated" : ""}
                                   onBlur={(event) => updateName({ lastName: event.target.value })} />
                    </div>
                </div>
            </div>

            <div className="account-section">
                <div className="tfa-title">
                    <h2>Two-factor authentication</h2>
                    {user?.totpEnabled ? <p className="active">Active</p> : <p className="inactive">Inactive</p>}
                </div>
                <div className="section-inner">
                    <p style={{ maxWidth: "25rem" }}>Добавьте дополнительный уровень безопасности в свою учетную запись, включив
                        two-factor authentication.</p>
                    {!user?.totpEnabled && <Button text="Enable 2FA" onClick={() => setTwoFactorOpen(true)} />}
                    {user?.totpEnabled ? <Button text="Disable 2FA" onClick={disable2FA} /> : null}
                </div>
            </div>

            <div className="account-section">
                <h2>Изменить пароль</h2>
                <div className="section-inner">
                    <p style={{ maxWidth: "25rem" }}>Выберите новый и безопасный пароль для своей учетной записи здесь.</p>

                    <Button text="Change password" onClick={() => setPasswordChangeOpen(true)} />
                </div>
            </div>

        </div>
    );
};